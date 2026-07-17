import os, sys, io, django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from PIL import Image

from datetime import date
from telegram import (Update, ReplyKeyboardMarkup, KeyboardButton,
                       InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardRemove)
from telegram.ext import (Application, CommandHandler, MessageHandler,
                           CallbackQueryHandler, filters, ContextTypes)
from django.conf import settings
from django.db import close_old_connections
from asgiref.sync import sync_to_async
from apps.core.models import Mahalla, Hisobot, Rasm, TargibotUtkazilganJoy, Inspektor, HamkorXodim

TOKEN = settings.TELEGRAM_TOKEN

# ─── Qadam nomlari ────────────────────────────────────────────────────────────
STEP_TYPE      = 'type'
STEP_JOY       = 'joy'
STEP_COUNT     = 'count'
STEP_AGE1      = 'age1'       # 18 gacha
STEP_AGE2      = 'age2'       # 18 katta
STEP_PHOTO     = 'photo'
STEP_LOCATION  = 'location'
STEP_OAV       = 'oav'        # OAV turi tanlash (TV/Radio/Gazeta...)
STEP_OAV_PROOF = 'oav_proof'  # Havola yoki rasm (isboti)

OAV_NOMLAR = {3: '📺 TV', 4: '📻 Radio', 5: '📰 Gazeta', 6: '📓 Jurnal', 7: '🌐 Internet/Ijtimoiy tarmoq'}

# ─── DB yordamchi funksiyalar ─────────────────────────────────────────────────

@sync_to_async
def db_get_by_phone(phone):
    close_old_connections()
    """
    Avval yangi Inspektor jadvalidan qidiradi.
    Topilmasa HamkorXodim, so'ngra mahalla.inspektor_tel (legacy) dan.
    (inspektor_yoki_xodim, mahalla, xodim) qaytaradi.
    """
    ins = Inspektor.objects.filter(tel=phone, is_active=True).select_related('mahalla__tuman').first()
    if ins:
        return ins, ins.mahalla, None
    xodim = (
        HamkorXodim.objects.filter(tel=phone, is_active=True).select_related('tashkilot__mahalla__tuman', 'tashkilot').first() or
        HamkorXodim.objects.filter(tel='+'+phone, is_active=True).select_related('tashkilot__mahalla__tuman', 'tashkilot').first()
    )
    if xodim and xodim.tashkilot.mahalla:
        return None, xodim.tashkilot.mahalla, xodim
    if xodim and not xodim.tashkilot.mahalla:
        # Tuman hodimi: tashkilot tumanidagi is_tuman=True mahallani qidirish
        if xodim.tashkilot.tuman_id:
            m_tuman = Mahalla.objects.filter(tuman_id=xodim.tashkilot.tuman_id, is_tuman=True).first()
            if m_tuman:
                return None, m_tuman, xodim
        return None, None, xodim  # tashkilot mahallasi belgilanmagan
    m = Mahalla.objects.filter(inspektor_tel=phone).first() or \
        Mahalla.objects.filter(inspektor_tel='+'+phone).first()
    return None, m, None

@sync_to_async
def db_get_by_tg(tg_id):
    close_old_connections()
    """tg_id orqali (inspektor, mahalla, xodim) topadi."""
    ins = Inspektor.objects.filter(tg_id=tg_id, is_active=True).select_related('mahalla__tuman').first()
    if ins:
        return ins, ins.mahalla, None
    xodim = HamkorXodim.objects.filter(tg_id=tg_id, is_active=True).select_related('tashkilot__mahalla__tuman', 'tashkilot').first()
    if xodim and xodim.tashkilot.mahalla:
        return None, xodim.tashkilot.mahalla, xodim
    if xodim and not xodim.tashkilot.mahalla:
        if xodim.tashkilot.tuman_id:
            m_tuman = Mahalla.objects.filter(tuman_id=xodim.tashkilot.tuman_id, is_tuman=True).first()
            if m_tuman:
                return None, m_tuman, xodim
    m = Mahalla.objects.filter(tg_id=tg_id).first()
    return None, m, None

@sync_to_async
def db_save_tg(inspektor, mahalla, tg_id, xodim=None):
    """tg_id ni saqlaydi — yangi yoki legacy."""
    if xodim:
        xodim.tg_id = tg_id
        xodim.save(update_fields=['tg_id'])
    elif inspektor:
        inspektor.tg_id = tg_id
        inspektor.save(update_fields=['tg_id'])
    else:
        mahalla.tg_id = tg_id
        mahalla.save(update_fields=['tg_id'])

@sync_to_async
def db_delete_drafts(mahalla):
    Hisobot.objects.filter(mahalla=mahalla, status=0).delete()

@sync_to_async
def db_create_hisobot(mahalla, xodim=None):
    return Hisobot.objects.create(mahalla=mahalla, hamkor_xodim=xodim)

@sync_to_async
def db_get_draft(mahalla):
    return Hisobot.objects.filter(mahalla=mahalla, status=0).first() if mahalla else None

@sync_to_async
def db_set_turi(hisobot, turi):
    hisobot.targibot_turi = turi
    hisobot.save(update_fields=['targibot_turi'])

@sync_to_async
def db_set_joy(hisobot, joy_id):
    hisobot.targibot_utgan_joy = joy_id
    hisobot.save(update_fields=['targibot_utgan_joy'])

@sync_to_async
def db_set_count(hisobot, soni, msg_id):
    hisobot.qatnashchilar_soni = soni
    hisobot.message_id         = msg_id
    hisobot.save(update_fields=['qatnashchilar_soni', 'message_id'])

@sync_to_async
def db_set_yosh(hisobot, gacha, katta):
    if hisobot.targibot_turi == 1:
        hisobot.offline_18_gacha = gacha
        hisobot.offline_18_katta = katta
        hisobot.save(update_fields=['offline_18_gacha', 'offline_18_katta'])
    else:
        hisobot.online_18_gacha = gacha
        hisobot.online_18_katta = katta
        hisobot.save(update_fields=['online_18_gacha', 'online_18_katta'])

@sync_to_async
def db_set_materials(hisobot, video, banner, flayer, buklet, boshqa):
    hisobot.video_kontent_soni   = video
    hisobot.banner_soni          = banner
    hisobot.flayer_soni          = flayer
    hisobot.buklet_soni          = buklet
    hisobot.boshqa_material_soni = boshqa
    hisobot.save(update_fields=['video_kontent_soni','banner_soni',
                                'flayer_soni','buklet_soni','boshqa_material_soni'])

@sync_to_async
def db_set_proof_url(hisobot, url):
    hisobot.proof_url = url
    hisobot.save(update_fields=['proof_url'])

@sync_to_async
def db_set_location(hisobot, lat, lng):
    hisobot.latitude  = lat
    hisobot.longitude = lng
    hisobot.save(update_fields=['latitude', 'longitude'])

@sync_to_async
def db_submit(hisobot, msg_id):
    # Probatsiya (kat=13) hisobotlari avtomatik tasdiqlangan bo'ladi
    joy_ids_kat13 = list(
        TargibotUtkazilganJoy.objects.filter(kategoriya=13).values_list('id', flat=True)
    )
    is_probatsiya = hisobot.targibot_utgan_joy in joy_ids_kat13
    hisobot.status     = 2 if is_probatsiya else 1
    hisobot.message_id = msg_id
    hisobot.save(update_fields=['status', 'message_id'])

@sync_to_async
def db_get_joylar(joy_turi):
    return list(TargibotUtkazilganJoy.objects.all().order_by('kategoriya'))

@sync_to_async
def db_count_photos(hisobot):
    return Rasm.objects.filter(hisobot=hisobot).count()

@sync_to_async
def db_photo_exists(file_unique_id):
    """Bu file_unique_id bazada allaqachon bormi? (aynan bir xil fayl)"""
    return Rasm.objects.filter(file_unique_id=file_unique_id).exists()

@sync_to_async
def db_add_rasm(hisobot, rasm_url, file_unique_id=None, phash=None):
    Rasm.objects.create(hisobot=hisobot, rasm_url=rasm_url,
                        file_unique_id=file_unique_id, phash=phash)

# ─── Yordamchi: joy tanlash klaviaturasi ─────────────────────────────────────

async def send_joy_keyboard(chat, joy_turi):
    joylar  = await db_get_joylar(joy_turi)
    buttons = [
        [InlineKeyboardButton(j.targibot_utkazilgan_joy, callback_data=f'joy_{j.id}')]
        for j in joylar
    ]
    if buttons:
        await chat.send_message(
            "📍 Targ'ibot o'tkazilgan joyni tanlang:",
            reply_markup=InlineKeyboardMarkup(buttons)
        )
    else:
        await chat.send_message("👥 Qatnashchilar sonini kiriting (faqat raqam):")

# ─── /start ──────────────────────────────────────────────────────────────────

async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    ctx.user_data.clear()
    kb = [[KeyboardButton("📱 Kontakt ulashish", request_contact=True)]]
    await update.message.reply_text(
        "👋 Assalomu Alaykum!\n"
        "Tizimga kirish uchun <b>«Kontakt ulashish»</b> tugmasini bosing.",
        parse_mode='HTML',
        reply_markup=ReplyKeyboardMarkup(kb, resize_keyboard=True, one_time_keyboard=True)
    )

# ─── Kontakt ─────────────────────────────────────────────────────────────────

async def contact(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    c     = update.message.contact
    phone = c.phone_number.replace('+', '')

    ins, m, xodim = await db_get_by_phone(phone)

    if not m:
        if xodim:
            await update.message.reply_text(
                f"⚠️ <b>{xodim.fio}</b>, siz tizimga kirgansiz!\n"
                "Lekin sizga hali <b>mahalla belgilanmagan</b>.\n"
                "Iltimos, admin bilan bog'laning.",
                parse_mode='HTML'
            )
        else:
            await update.message.reply_text(
                f"❌ Kechirasiz, <b>{c.first_name}</b>!\n"
                "Siz tizimda ro'yxatdan o'tmagansiz.\n"
                "Mahalla inspektori bo'lsangiz, admin bilan bog'laning.",
                parse_mode='HTML'
            )
        return

    # tg_id saqlash
    await db_save_tg(ins, m, update.effective_chat.id, xodim=xodim)
    await db_delete_drafts(m)
    h = await db_create_hisobot(m, xodim=xodim)

    ctx.user_data['step'] = STEP_TYPE

    if xodim:
        fio = xodim.fio
        tashkilot = xodim.tashkilot.nomi
        await update.message.reply_text(
            f"✅ Xush kelibsiz!\n"
            f"👤 <b>{fio}</b>\n"
            f"🏢 <b>{tashkilot}</b>\n"
            f"🏛 <b>{m.mahalla_nomi}</b>",
            parse_mode='HTML',
            reply_markup=ReplyKeyboardRemove()
        )
    else:
        fio = ins.fio if ins else m.inspektor_fio
        await update.message.reply_text(
            f"✅ Xush kelibsiz!\n"
            f"👤 <b>{fio}</b>\n"
            f"🏛 <b>{m.mahalla_nomi}</b>",
            parse_mode='HTML',
            reply_markup=ReplyKeyboardRemove()
        )
    type_rows = [[
        InlineKeyboardButton("📢 Offline", callback_data="offline"),
        InlineKeyboardButton("🌐 Online",  callback_data="online"),
    ]]
    if m.is_tuman:
        type_rows.append([InlineKeyboardButton("📺 Ommaviy axborot vositalari", callback_data="ommaviy")])
    await update.message.reply_text(
        "📋 Targ'ibot turini tanlang:",
        reply_markup=InlineKeyboardMarkup(type_rows)
    )

# ─── Inline tugmalar ─────────────────────────────────────────────────────────

async def callback(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q    = update.callback_query
    data = q.data
    chat = q.message.chat_id
    _, m, _ = await db_get_by_tg(chat)
    h    = await db_get_draft(m)

    if not m or not h:
        await q.answer("⚠️ Sessiya tugagan. /start bosing.", show_alert=True)
        return

    if data in ('offline', 'online'):
        if ctx.user_data.get('step') != STEP_TYPE:
            await q.answer("Bu qadam o'tib ketgan.", show_alert=True)
            return
        turi = 1 if data == 'offline' else 2
        await db_set_turi(h, turi)
        ctx.user_data['step'] = STEP_JOY
        await q.edit_message_text(
            f"✅ Targ'ibot turi: <b>{'📢 OFFLINE' if turi==1 else '🌐 ONLINE'}</b>",
            parse_mode='HTML'
        )
        await send_joy_keyboard(q.message.chat, turi)

    elif data == 'ommaviy':
        if ctx.user_data.get('step') != STEP_TYPE:
            await q.answer("Bu qadam o'tib ketgan.", show_alert=True)
            return
        ctx.user_data['step'] = STEP_OAV
        await q.edit_message_text("✅ Targ'ibot turi: <b>📺 Ommaviy axborot vositalari</b>", parse_mode='HTML')
        await q.message.chat.send_message(
            "📺 Ommaviy axborot vositasini tanlang:",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("📺 TV",       callback_data="oav_3"),
                 InlineKeyboardButton("📻 Radio",    callback_data="oav_4")],
                [InlineKeyboardButton("📰 Gazeta",   callback_data="oav_5"),
                 InlineKeyboardButton("📓 Jurnal",   callback_data="oav_6")],
                [InlineKeyboardButton("🌐 Internet / Ijtimoiy tarmoq", callback_data="oav_7")],
            ])
        )

    elif data.startswith('oav_'):
        if ctx.user_data.get('step') != STEP_OAV:
            await q.answer("Avval OAV turini tanlang.", show_alert=True)
            return
        turi = int(data.split('_')[1])
        await db_set_turi(h, turi)
        ctx.user_data['step'] = STEP_COUNT
        nom = OAV_NOMLAR.get(turi, '')
        await q.edit_message_text(f"✅ OAV turi: <b>{nom}</b>", parse_mode='HTML')
        await q.message.chat.send_message(
            "🔢 Necha marta efirga uzatildi / nashr qilindi?\n\n"
            "<i>Faqat raqam yuboring. (Masalan: 2)</i>",
            parse_mode='HTML'
        )

    elif data.startswith('joy_'):
        if ctx.user_data.get('step') != STEP_JOY:
            await q.answer("Avval targ'ibot turini tanlang.", show_alert=True)
            return
        joy_id = int(data.split('_')[1])
        await db_set_joy(h, joy_id)
        ctx.user_data['step'] = STEP_COUNT
        joylar   = await db_get_joylar(h.targibot_turi or 1)
        joy_nomi = next((j.targibot_utkazilgan_joy for j in joylar if j.id == joy_id), '')
        await q.edit_message_text(f"✅ Joy: <b>{joy_nomi}</b>", parse_mode='HTML')
        label = ("👥 Necha kishiga targ'ibot qilindi?" if h.targibot_turi == 1
                 else "👥 Guruh/kanal foydalanuvchilar soni?")
        await q.message.chat.send_message(label + "\n\n<i>Faqat raqam yuboring.</i>", parse_mode='HTML')

    await q.answer()

# ─── Rasm ────────────────────────────────────────────────────────────────────

async def photo(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    chat = update.effective_chat.id
    _, m, _ = await db_get_by_tg(chat)
    h    = await db_get_draft(m)

    if not m or not h:
        await update.message.reply_text("⚠️ /start bosib qaytadan boshlang.")
        return

    step = ctx.user_data.get('step')
    if step == STEP_TYPE:
        await update.message.reply_text("⚠️ Avval targ'ibot turini tanlang (Offline/Online).")
        return
    if step == STEP_OAV:
        await update.message.reply_text("⚠️ Avval OAV turini tanlang (TV/Radio/Gazeta...).")
        return
    if step == STEP_JOY:
        await update.message.reply_text("⚠️ Avval targ'ibot o'tkazilgan joyni tanlang.")
        return
    if step == STEP_COUNT:
        await update.message.reply_text("⚠️ Avval qatnashchilar sonini kiriting (raqam).")
        return
    if step in (STEP_AGE1, STEP_AGE2):
        await update.message.reply_text("⚠️ Avval yoshlar sonini kiriting (raqam).")
        return

    tg_photo      = update.message.photo[-1]
    file_unique_id = tg_photo.file_unique_id

    # ─── 1. file_unique_id tekshiruvi (tez) ──────────────────────────────────
    already_exists = await db_photo_exists(file_unique_id)
    if already_exists:
        await update.message.reply_text(
            "❌ <b>Bu rasm avval yuklangan!</b>\n\n"
            "Tizim bu rasmni tanidi — u ilgari boshqa hisobotda ishlatilgan.\n"
            "Iltimos, <b>hozir tushirilgan yangi rasm</b> yuboring.",
            parse_mode='HTML'
        )
        return

    # ─── Rasmni yuklab olish ──────────────────────────────────────────────────
    photo_file = await tg_photo.get_file()
    name = f"tg_{file_unique_id}.jpg"
    path = os.path.join(settings.MEDIA_ROOT, 'images', name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    await photo_file.download_to_drive(path)

    # ─── Rasmni siqish (max 900px, sifat 70%) ────────────────────────────────
    try:
        img = Image.open(path).convert('RGB')
        img.thumbnail((900, 900), Image.LANCZOS)
        img.save(path, 'JPEG', quality=70, optimize=True)
    except Exception:
        pass

    await db_add_rasm(h, name, file_unique_id=file_unique_id)
    foto_soni = await db_count_photos(h)

    # OAV uchun rasm = isboti, darhol yuboriladi
    if step == STEP_OAV_PROOF:
        await db_submit(h, update.message.message_id)
        ctx.user_data.clear()
        nom = OAV_NOMLAR.get(h.targibot_turi, 'OAV')
        await update.message.reply_text(
            f"✅ <b>Hisobot muvaffaqiyatli yuborildi!</b>\n"
            f"📸 {nom} isboti (rasm) saqlandi.\n"
            f"Tekshirilgandan so'ng xabar beramiz. Rahmat! 🙏",
            parse_mode='HTML',
            reply_markup=ReplyKeyboardRemove()
        )
        return

    # Online targ'ibotda lokatsiya shart emas — to'g'ridan yuborish tugmasini ko'rsatamiz
    if h.targibot_turi == 2:
        ctx.user_data['step'] = STEP_PHOTO
        kb = [[KeyboardButton("✅ Hisobotni yuborish")]]
        await update.message.reply_text(
            f"🖼 Rasm qabul qilindi ({foto_soni} ta).\n\n"
            "📸 Yana rasm yuborishingiz mumkin.\n"
            "✅ Tayyor bo'lsangiz — <b>«Hisobotni yuborish»</b> tugmasini bosing.",
            parse_mode='HTML',
            reply_markup=ReplyKeyboardMarkup(kb, resize_keyboard=True, one_time_keyboard=True)
        )
    else:
        ctx.user_data['step'] = STEP_LOCATION
        kb = [[KeyboardButton("📍 Lokatsiya yuborish", request_location=True)]]
        await update.message.reply_text(
            f"🖼 Rasm qabul qilindi ({foto_soni} ta).\n\n"
            "📸 Yana rasm yuborishingiz mumkin.\n"
            "📍 Tayyor bo'lsangiz — <b>lokatsiyangizni yuboring</b>.",
            parse_mode='HTML',
            reply_markup=ReplyKeyboardMarkup(kb, resize_keyboard=True, one_time_keyboard=True)
        )

# ─── Matn ────────────────────────────────────────────────────────────────────

async def text_msg(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    chat = update.effective_chat.id
    msg  = update.message.text.strip()
    step = ctx.user_data.get('step')

    if msg == '✅ Hisobotni yuborish':
        _, m, _ = await db_get_by_tg(chat)
        h = await db_get_draft(m)
        if not m or not h:
            await update.message.reply_text("⚠️ /start bosib qaytadan boshlang.")
            return
        foto_soni = await db_count_photos(h)
        if foto_soni == 0:
            await update.message.reply_text(
                "⚠️ Avval rasm yuborishingiz kerak!"
            )
            return
        # Offline uchun lokatsiya majburiy; online da shart emas
        if step == STEP_LOCATION and h.targibot_turi != 2:
            kb = [[KeyboardButton("📍 Lokatsiya yuborish", request_location=True)]]
            await update.message.reply_text(
                "📍 Iltimos, avval <b>lokatsiyangizni yuboring</b>.",
                parse_mode='HTML',
                reply_markup=ReplyKeyboardMarkup(kb, resize_keyboard=True, one_time_keyboard=True)
            )
            return
        await db_submit(h, update.message.message_id)
        ctx.user_data.clear()
        await update.message.reply_text(
            "✅ <b>Hisobot muvaffaqiyatli yuborildi!</b>\n"
            "Tekshirilgandan so'ng xabar beramiz. Rahmat! 🙏",
            parse_mode='HTML',
            reply_markup=ReplyKeyboardRemove()
        )
        return

    if step == STEP_COUNT:
        if not msg.isdigit() or int(msg) <= 0:
            await update.message.reply_text(
                "❌ Noto'g'ri format!\n"
                "Iltimos, faqat <b>musbat raqam</b> yuboring.\n"
                "<i>Masalan: 45</i>",
                parse_mode='HTML'
            )
            return
        _, m, _ = await db_get_by_tg(chat)
        h = await db_get_draft(m)
        if not m or not h:
            await update.message.reply_text("⚠️ /start bosib qaytadan boshlang.")
            return
        await db_set_count(h, int(msg), update.message.message_id)
        # OAV uchun alohida yo'l (yosh va lokatsiya so'ralmaydi)
        if h.targibot_turi and h.targibot_turi >= 3:
            ctx.user_data['step'] = STEP_OAV_PROOF
            nom = OAV_NOMLAR.get(h.targibot_turi, 'OAV')
            await update.message.reply_text(
                f"✅ {nom} soni: <b>{msg}</b>\n\n"
                f"🔗 Havola (URL) yuboring\n"
                f"<i>yoki screenshot/foto yuboring.</i>",
                parse_mode='HTML'
            )
            return
        ctx.user_data['step'] = STEP_AGE1
        if h.targibot_turi == 1:
            await update.message.reply_text(
                "👶 <b>18 yoshgacha</b> bo'lgan qatnashchilar soni:\n\n"
                "<i>Targ'ibot ishtirokchilari orasida 18 yoshga to'lmaganlar nechta?</i>\n"
                "<i>(Yo'q bo'lsa 0 yozing)</i>",
                parse_mode='HTML'
            )
        else:
            await update.message.reply_text(
                "👶 <b>18 yoshgacha</b> bo'lgan obunachlar soni:\n\n"
                "<i>Siz targ'ibot qilayotgan kanal yoki guruhdagi 18 yoshga to'lmagan\n"
                "obunachlar taxminan nechta?</i>\n"
                "<i>(Yo'q bo'lsa 0 yozing)</i>",
                parse_mode='HTML'
            )
        return

    if step == STEP_AGE1:
        if not msg.isdigit() or int(msg) < 0:
            await update.message.reply_text(
                "❌ Faqat <b>musbat raqam</b> yoki <b>0</b> yuboring.",
                parse_mode='HTML'
            )
            return
        ctx.user_data['age1'] = int(msg)
        ctx.user_data['step'] = STEP_AGE2
        _, m, _ = await db_get_by_tg(chat)
        h = await db_get_draft(m)
        if h and h.targibot_turi == 1:
            await update.message.reply_text(
                "👴 <b>18 yoshdan katta</b> qatnashchilar soni:\n\n"
                "<i>Targ'ibot ishtirokchilari orasida 18 va undan katta yoshdagilar nechta?</i>\n"
                "<i>(Yo'q bo'lsa 0 yozing)</i>",
                parse_mode='HTML'
            )
        else:
            await update.message.reply_text(
                "👴 <b>18 yoshdan katta</b> obunachlar soni:\n\n"
                "<i>Siz targ'ibot qilayotgan kanal yoki guruhdagi 18 va undan katta\n"
                "yoshdagi obunachlar taxminan nechta?</i>\n"
                "<i>(Yo'q bo'lsa 0 yozing)</i>",
                parse_mode='HTML'
            )
        return

    if step == STEP_AGE2:
        if not msg.isdigit() or int(msg) < 0:
            await update.message.reply_text(
                "❌ Faqat <b>musbat raqam</b> yoki <b>0</b> yuboring.",
                parse_mode='HTML'
            )
            return
        age1 = ctx.user_data.get('age1', 0)
        age2 = int(msg)
        _, m, _ = await db_get_by_tg(chat)
        h = await db_get_draft(m)
        if not m or not h:
            await update.message.reply_text("⚠️ /start bosib qaytadan boshlang.")
            return
        await db_set_yosh(h, age1, age2)
        ctx.user_data['step'] = STEP_PHOTO
        label = ("📸 Targ'ibot rasmlarini yuboring." if h.targibot_turi == 1
                 else "📸 Guruhga yuborgan material skrinshotlarini yuboring.")
        await update.message.reply_text(
            f"✅ Yosh ma'lumotlari saqlandi:\n"
            f"  • 18 yoshgacha: <b>{age1}</b> kishi\n"
            f"  • 18 yoshdan katta: <b>{age2}</b> kishi\n\n"
            f"{label}",
            parse_mode='HTML'
        )
        return

    if step == STEP_OAV_PROOF:
        # Matn (URL/havola) isboti sifatida qabul qilinadi
        _, m, _ = await db_get_by_tg(chat)
        h = await db_get_draft(m)
        if not m or not h:
            await update.message.reply_text("⚠️ /start bosib qaytadan boshlang.")
            return
        await db_set_proof_url(h, msg)
        await db_submit(h, update.message.message_id)
        ctx.user_data.clear()
        nom = OAV_NOMLAR.get(h.targibot_turi, 'OAV')
        await update.message.reply_text(
            f"✅ <b>Hisobot muvaffaqiyatli yuborildi!</b>\n"
            f"📺 {nom} isboti saqlandi.\n"
            f"Tekshirilgandan so'ng xabar beramiz. Rahmat! 🙏",
            parse_mode='HTML',
            reply_markup=ReplyKeyboardRemove()
        )
        return

    if step == STEP_TYPE:
        await update.message.reply_text("⚠️ Iltimos, yuqoridagi tugmalardan birini tanlang (Offline/Online).")
    elif step == STEP_OAV:
        await update.message.reply_text("⚠️ Iltimos, yuqoridagi ro'yxatdan OAV turini tanlang.")
    elif step == STEP_JOY:
        await update.message.reply_text("⚠️ Iltimos, yuqoridagi ro'yxatdan joy tanlang.")
    elif step in (STEP_AGE1, STEP_AGE2):
        await update.message.reply_text("⚠️ Iltimos, faqat <b>raqam</b> yuboring (yo'q bo'lsa 0).", parse_mode='HTML')
    elif step == STEP_PHOTO:
        await update.message.reply_text("📸 Rasm yuboring.")
    elif step == STEP_LOCATION:
        kb = [[KeyboardButton("📍 Lokatsiya yuborish", request_location=True)]]
        await update.message.reply_text(
            "📍 Iltimos, targ'ibot o'tkazilgan joyning <b>lokatsiyasini yuboring</b>.\n"
            "<i>Telefondagi «📍 Lokatsiya yuborish» tugmasini bosing.</i>",
            parse_mode='HTML',
            reply_markup=ReplyKeyboardMarkup(kb, resize_keyboard=True, one_time_keyboard=True)
        )
    else:
        await update.message.reply_text(
            "Salom! Hisobot yuborish uchun /start bosing.",
            reply_markup=ReplyKeyboardRemove()
        )

# ─── Lokatsiya ───────────────────────────────────────────────────────────────

async def location_msg(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    chat = update.effective_chat.id
    loc  = update.message.location
    step = ctx.user_data.get('step')

    if step != STEP_LOCATION:
        await update.message.reply_text("⚠️ Hozir lokatsiya kutilmayapdi. /start bosing.")
        return

    _, m, _ = await db_get_by_tg(chat)
    h    = await db_get_draft(m)
    if not m or not h:
        await update.message.reply_text("⚠️ /start bosib qaytadan boshlang.")
        return

    await db_set_location(h, loc.latitude, loc.longitude)

    # Hisobotni yuborish
    foto_soni = await db_count_photos(h)
    if foto_soni == 0:
        await update.message.reply_text(
            "⚠️ Kamida 1 ta rasm yuborishingiz kerak! Rasm yuboring.",
            reply_markup=ReplyKeyboardRemove()
        )
        ctx.user_data['step'] = STEP_PHOTO
        return

    await db_submit(h, update.message.message_id)
    ctx.user_data.clear()
    await update.message.reply_text(
        "✅ <b>Hisobot muvaffaqiyatli yuborildi!</b>\n"
        "📍 Lokatsiya ham saqlandi.\n"
        "Tekshirilgandan so'ng xabar beramiz. Rahmat! 🙏",
        parse_mode='HTML',
        reply_markup=ReplyKeyboardRemove()
    )

# ─── Ishga tushirish ─────────────────────────────────────────────────────────

def run():
    app = (
        Application.builder()
        .token(TOKEN)
        .connect_timeout(30)
        .read_timeout(30)
        .write_timeout(30)
        .pool_timeout(30)
        .build()
    )
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.CONTACT, contact))
    app.add_handler(CallbackQueryHandler(callback))
    app.add_handler(MessageHandler(filters.PHOTO, photo))
    app.add_handler(MessageHandler(filters.LOCATION, location_msg))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, text_msg))
    sys.stdout.reconfigure(encoding='utf-8', errors='replace') if hasattr(sys.stdout, 'reconfigure') else None
    print("Bot ishga tushdi! (TOKEN: ...{})".format(TOKEN[-10:]))
    app.run_polling(drop_pending_updates=True)

if __name__ == '__main__':
    run()
