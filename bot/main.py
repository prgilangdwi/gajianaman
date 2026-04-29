# bot/main.py

import os
import logging
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes
)

from bot.handlers.commands import (
    cmd_start,
    cmd_add,
    cmd_income,
    cmd_summary,
    cmd_history,
    cmd_budget,
    cmd_goal,
    cmd_help,
)

load_dotenv()
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("BOT_TOKEN")


async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle inline keyboard callbacks (e.g. category correction)"""
    query = update.callback_query
    await query.answer()

    if query.data.startswith("recat:"):
        new_category = query.data.split(":", 1)[1]
        await query.edit_message_text(
            f"✅ Kategori diperbarui ke: *{new_category}*\n"
            f"_(Update DB akan tersedia di versi berikutnya)_",
            parse_mode="Markdown"
        )


def main():
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    # Register command handlers
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("add", cmd_add))
    app.add_handler(CommandHandler("income", cmd_income))
    app.add_handler(CommandHandler("summary", cmd_summary))
    app.add_handler(CommandHandler("history", cmd_history))
    app.add_handler(CommandHandler("budget", cmd_budget))
    app.add_handler(CommandHandler("goal", cmd_goal))
    app.add_handler(CommandHandler("help", cmd_help))

    # Inline keyboard callbacks
    app.add_handler(CallbackQueryHandler(handle_callback))

    logger.info("🤖 FinTrack Bot is running...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
