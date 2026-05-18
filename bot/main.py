# bot/main.py

import os
import logging
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    filters,
    ContextTypes,
)

from bot.handlers.commands import (
    cmd_start, cmd_add, cmd_income, cmd_summary, cmd_history,
    cmd_budget, cmd_goal, cmd_help, cmd_delete, cmd_stats, cmd_cancel,
    cmd_tutorial, cmd_quickbudget, cmd_commands, cmd_wallet, cmd_insights, cmd_notify, cmd_csv, cmd_trends,
    cmd_smart_alerts, cmd_recurring, cmd_budget_tips, cmd_health, cmd_spending_patterns, cmd_forecast,
    cmd_category_analysis, cmd_goal_progress, cmd_subscribe,
    get_splitbill_handler,
)
from bot.handlers.callbacks import handle_callback
from bot.handlers.messages import handle_message
from bot.handlers.photos import handle_photo

load_dotenv()
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("BOT_TOKEN")


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE):
    logger.error("Unhandled exception:", exc_info=context.error)
    if not isinstance(update, Update) or not update.effective_message:
        return

    err_str = str(context.error).lower()
    is_db_error = any(k in err_str for k in ("enotfound", "connection", "asyncpg", "sqlalchemy", "timeout"))
    if is_db_error:
        await update.effective_message.reply_text(
            "⚠️ *Database tidak dapat dijangkau.*\n\n"
            "Kemungkinan Supabase project sedang paused.\n"
            "Admin sedang memperbaiki — coba lagi dalam beberapa menit.",
            parse_mode="Markdown",
        )
    else:
        await update.effective_message.reply_text(
            "⚠️ Terjadi kesalahan. Coba lagi dalam beberapa saat.\n"
            "Jika masalah berlanjut, ketik /start untuk memulai ulang."
        )


def main():
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    # ConversationHandlers — must be registered BEFORE generic message handlers
    app.add_handler(get_splitbill_handler())

    # Commands
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("add", cmd_add))
    app.add_handler(CommandHandler("income", cmd_income))
    app.add_handler(CommandHandler("summary", cmd_summary))
    app.add_handler(CommandHandler("history", cmd_history))
    app.add_handler(CommandHandler("budget", cmd_budget))
    app.add_handler(CommandHandler("goal", cmd_goal))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CommandHandler("delete", cmd_delete))
    app.add_handler(CommandHandler("stats", cmd_stats))
    app.add_handler(CommandHandler("tutorial", cmd_tutorial))
    app.add_handler(CommandHandler("quickbudget", cmd_quickbudget))
    app.add_handler(CommandHandler("cancel", cmd_cancel))
    app.add_handler(CommandHandler("commands", cmd_commands))
    app.add_handler(CommandHandler("wallet", cmd_wallet))
    app.add_handler(CommandHandler("insights", cmd_insights))
    app.add_handler(CommandHandler("notify", cmd_notify))
    app.add_handler(CommandHandler("csv", cmd_csv))
    app.add_handler(CommandHandler("trends", cmd_trends))
    app.add_handler(CommandHandler("smart_alerts", cmd_smart_alerts))
    app.add_handler(CommandHandler("recurring", cmd_recurring))
    app.add_handler(CommandHandler("budget_tips", cmd_budget_tips))
    app.add_handler(CommandHandler("health", cmd_health))
    app.add_handler(CommandHandler("spending_patterns", cmd_spending_patterns))
    app.add_handler(CommandHandler("forecast", cmd_forecast))
    app.add_handler(CommandHandler("category_analysis", cmd_category_analysis))
    app.add_handler(CommandHandler("goal_progress", cmd_goal_progress))
    app.add_handler(CommandHandler("subscribe", cmd_subscribe))

    # Inline keyboard callbacks
    app.add_handler(CallbackQueryHandler(handle_callback))

    # Photo messages — analyze with Claude vision
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))

    # Natural language fallback (non-command text messages)
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    # Global error handler
    app.add_error_handler(error_handler)

    logger.info("🤖 Gajian Aman Bot is running...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
