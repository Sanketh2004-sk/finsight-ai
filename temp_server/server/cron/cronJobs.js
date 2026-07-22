// ============================================================
// cron/cronJobs.js — Background Scheduled Tasks
// Uses node-cron to run automated jobs on a schedule
// ============================================================

const cron = require("node-cron");
const Subscription = require("../models/Subscription");
const Expense = require("../models/Expense");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Income = require("../models/Income");
const { generateMonthlyPDF } = require("../services/pdfService");
const { sendMonthlyReport } = require("../services/emailService");

console.log("🕐 Cron jobs initialized");

// ────────────────────────────────────────────────────────────
// JOB 1: Check Subscription Renewals (runs every day at 8 AM)
// Sends a reminder notification X days before renewal
// ────────────────────────────────────────────────────────────
cron.schedule("0 8 * * *", async () => {
  console.log("🔄 [Cron] Checking subscription renewals...");

  try {
    const today = new Date();
    const inThreeDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Find subscriptions renewing in the next 3 days (and reminder not sent yet)
    const upcomingRenewals = await Subscription.find({
      isActive: true,
      nextRenewalDate: { $gte: today, $lte: inThreeDays },
      reminderSent: false,
    }).populate("user", "name email notificationPreferences");

    for (const sub of upcomingRenewals) {
      const daysLeft = Math.ceil((sub.nextRenewalDate - today) / (1000 * 60 * 60 * 24));

      await Notification.create({
        user: sub.user._id,
        type: "subscription_renewal",
        title: `📅 Subscription Renewal Reminder`,
        message: `"${sub.name}" renews in ${daysLeft} day(s) for ₹${sub.amount}`,
        link: "/subscriptions",
      });

      // Mark reminder as sent to avoid duplicate notifications
      sub.reminderSent = true;
      await sub.save();
    }

    if (upcomingRenewals.length > 0) {
      console.log(`✅ [Cron] Sent ${upcomingRenewals.length} renewal reminder(s)`);
    }
  } catch (error) {
    console.error("❌ [Cron] Renewal check failed:", error.message);
  }
});

// ────────────────────────────────────────────────────────────
// JOB 2: Reset Subscription Reminder Flags (runs monthly on 1st)
// Resets reminderSent after the renewal date has passed
// ────────────────────────────────────────────────────────────
cron.schedule("0 0 1 * *", async () => {
  console.log("🔄 [Cron] Resetting subscription reminder flags...");

  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find subscriptions that already renewed and update their next renewal date
    const renewedSubs = await Subscription.find({
      isActive: true,
      nextRenewalDate: { $lt: new Date() },
    });

    for (const sub of renewedSubs) {
      // Calculate next renewal date based on billing cycle
      const nextDate = new Date(sub.nextRenewalDate);
      if (sub.billingCycle === "weekly") nextDate.setDate(nextDate.getDate() + 7);
      else if (sub.billingCycle === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
      else if (sub.billingCycle === "quarterly") nextDate.setMonth(nextDate.getMonth() + 3);
      else if (sub.billingCycle === "yearly") nextDate.setFullYear(nextDate.getFullYear() + 1);

      sub.nextRenewalDate = nextDate;
      sub.reminderSent = false;
      await sub.save();
    }

    console.log(`✅ [Cron] Updated ${renewedSubs.length} subscription(s)`);
  } catch (error) {
    console.error("❌ [Cron] Subscription update failed:", error.message);
  }
});

// ────────────────────────────────────────────────────────────
// JOB 3: Generate & Email Monthly Reports (runs on 1st of each month at 9 AM)
// ────────────────────────────────────────────────────────────
cron.schedule("0 9 1 * *", async () => {
  console.log("🔄 [Cron] Generating monthly reports...");

  try {
    const now = new Date();
    // Report covers the PREVIOUS month
    const reportMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const reportYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    const startDate = new Date(reportYear, reportMonth - 1, 1);
    const endDate = new Date(reportYear, reportMonth, 0, 23, 59, 59);

    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const period = `${months[reportMonth - 1]} ${reportYear}`;

    // Get all users with monthly report notifications enabled
    const users = await User.find({ "notificationPreferences.monthlyReport": true });

    for (const user of users) {
      try {
        const [expenseAgg, incomeAgg, categoryAgg] = await Promise.all([
          Expense.aggregate([
            { $match: { user: user._id, date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]),
          Income.aggregate([
            { $match: { user: user._id, date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]),
          Expense.aggregate([
            { $match: { user: user._id, date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: "$category", total: { $sum: "$amount" } } },
            { $sort: { total: -1 } },
          ]),
        ]);

        const totalExpenses = expenseAgg[0]?.total || 0;
        const totalIncome = incomeAgg[0]?.total || 0;
        const balance = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;

        const categoryBreakdown = {};
        categoryAgg.forEach((c) => { categoryBreakdown[c._id] = c.total; });

        // Generate PDF
        const pdfBuffer = await generateMonthlyPDF({
          user: { name: user.name, email: user.email },
          period,
          totalIncome,
          totalExpenses,
          balance,
          savingsRate,
          categoryBreakdown,
          transactions: [],
        });

        // Email the report
        if (user.notificationPreferences?.email) {
          await sendMonthlyReport(user.email, user.name, pdfBuffer, period);
        }

        // In-app notification
        await Notification.create({
          user: user._id,
          type: "monthly_report",
          title: "📊 Monthly Report Ready",
          message: `Your financial report for ${period} is ready. Download it from Reports.`,
          link: "/reports",
        });

        console.log(`✅ [Cron] Report sent to ${user.email}`);
      } catch (userError) {
        console.error(`❌ [Cron] Failed for user ${user.email}:`, userError.message);
        // Continue with other users even if one fails
      }
    }
  } catch (error) {
    console.error("❌ [Cron] Monthly report job failed:", error.message);
  }
});

module.exports = {}; // Required by require() but nothing to export
