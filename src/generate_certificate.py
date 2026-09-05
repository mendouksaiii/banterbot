import sys
import os
import textwrap
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont

def generate_certificate(victim_name, victim_phone, cause_of_death, fatal_roast, output_path, is_win=False):
    width = 1200
    height = 1400

    # Colors
    bg_color = (13, 13, 18)           # Deep midnight obsidian
    border_gold = (212, 175, 55)      # Classic aristocratic gold
    border_inner = (80, 70, 35)       # Hairline gold
    text_gold = (235, 205, 110)       # Bright gold
    text_white = (245, 245, 245)      # Chalk white
    text_muted = (160, 160, 175)      # Muted grey
    card_panel_bg = (22, 22, 30)      # Inner panel

    # Stamp color & text
    if is_win:
        accent_color = (46, 204, 113, 245)   # Vibrant emerald green
        stamp_text = "VICTORIOUS"
    else:
        accent_color = (225, 45, 45, 240)    # Red coroner stamp
        stamp_text = "DECEASED"

    img = Image.new("RGBA", (width, height), bg_color + (255,))
    draw = ImageDraw.Draw(img)

    # 1. Ornate Borders
    margin = 35
    draw.rectangle([margin, margin, width - margin, height - margin], outline=border_gold, width=4)
    draw.rectangle([margin + 12, margin + 12, width - margin - 12, height - margin - 12], outline=border_inner, width=2)

    # Corner accents
    corner_size = 45
    for cx, cy in [
        (margin, margin),
        (width - margin, margin),
        (margin, height - margin),
        (width - margin, height - margin),
    ]:
        dx = corner_size if cx == margin else -corner_size
        dy = corner_size if cy == margin else -corner_size
        draw.line([(cx, cy), (cx + dx, cy)], fill=border_gold, width=4)
        draw.line([(cx, cy), (cx, cy + dy)], fill=border_gold, width=4)

    # Font loader
    def get_font(size, bold=False):
        font_names = ["timesbd.ttf" if bold else "times.ttf", "arialbd.ttf" if bold else "arial.ttf", "DejaVuSans.ttf"]
        for fn in font_names:
            try:
                return ImageFont.truetype(fn, size)
            except:
                pass
        return ImageFont.load_default()

    font_title = get_font(44, bold=True)
    font_sub = get_font(23, bold=False)
    font_section = get_font(26, bold=True)
    font_body = get_font(24, bold=False)
    font_body_bold = get_font(24, bold=True)
    font_quote = get_font(28, bold=True)
    font_stamp = get_font(52, bold=True)
    font_footer = get_font(20, bold=False)

    # 2. Header
    y = 75
    header_title = "ROYAL DECREE OF CONCESSION" if is_win else "OFFICIAL CORONER'S REPORT"
    w_title = draw.textlength(header_title, font=font_title)
    draw.text(((width - w_title) / 2, y), header_title, font=font_title, fill=border_gold)

    y += 55
    sub_title = "CERTIFICATE OF RARE MORTAL TRIUMPH & SLAYAGE" if is_win else "CERTIFICATE OF CATASTROPHIC EMOTIONAL DAMAGE"
    w_sub = draw.textlength(sub_title, font=font_sub)
    draw.text(((width - w_sub) / 2, y), sub_title, font=font_sub, fill=text_gold)

    y += 40
    draw.line([(width // 4, y), (width * 3 // 4, y)], fill=border_inner, width=2)

    # 3. Details Panel
    y = 200
    panel_left = 90
    panel_right = width - 90
    panel_top = y
    panel_bottom = y + 250

    draw.rectangle([panel_left, panel_top, panel_right, panel_bottom], fill=card_panel_bg, outline=border_inner, width=2)

    py = panel_top + 25
    section_label = "CHAMPIONSHIP DETAILS" if is_win else "DECEDENT DETAILS"
    draw.text((panel_left + 30, py), section_label, font=font_section, fill=border_gold)
    py += 45

    current_time = datetime.now().strftime("%B %d, %Y - %I:%M %p")
    if is_win:
        details = [
            ("VICTOR IDENTIFIER:", f"{victim_name} ({victim_phone})"),
            ("TIME OF TRIUMPH:", current_time),
            ("BATTLE VERDICT:", "Historic Upset — Banterbot Concedes Defeat"),
            ("PRIMARY OCCURRENCE:", "Lord Banterbot III Slew by Pure Audacity"),
        ]
    else:
        details = [
            ("VICTIM IDENTIFIER:", f"{victim_name} ({victim_phone})"),
            ("TIME OF DEMISE:", current_time),
            ("BATTLE VERDICT:", "Flawless Knockout by Banterbot"),
            ("PRIMARY PATHOLOGY:", cause_of_death[:60]),
        ]

    for label, val in details:
        draw.text((panel_left + 30, py), label, font=font_body_bold, fill=text_gold)
        draw.text((panel_left + 350, py), val, font=font_body, fill=text_white)
        py += 40

    # 4. Punchline Panel
    y = panel_bottom + 35
    quote_panel_top = y
    quote_panel_bottom = y + 360

    draw.rectangle([panel_left, quote_panel_top, panel_right, quote_panel_bottom], fill=(18, 18, 25), outline=border_gold, width=2)
    qy = quote_panel_top + 25
    quote_title = "FATAL BLOW (USER'S WINNING PUNCHLINE):" if is_win else "FATAL INSTRUMENT / CAUSE OF DEATH:"
    draw.text((panel_left + 30, qy), quote_title, font=font_section, fill=border_gold)
    qy += 50

    wrapped_lines = textwrap.wrap(f'"{fatal_roast}"', width=52)
    for line in wrapped_lines[:6]:
        draw.text((panel_left + 45, qy), line, font=font_quote, fill=text_white)
        qy += 44

    # 5. Post-Mortem Vital Signs Panel
    y = quote_panel_bottom + 35
    vitals_top = y
    vitals_bottom = y + 200

    draw.rectangle([panel_left, vitals_top, panel_right, vitals_bottom], fill=card_panel_bg, outline=border_inner, width=2)
    vy = vitals_top + 25
    vitals_label = "DAMAGE ASSESSMENT" if is_win else "POST-MORTEM VITALS"
    draw.text((panel_left + 30, vy), vitals_label, font=font_section, fill=border_gold)
    vy += 45

    if is_win:
        vitals = [
            ("BANTERBOT DIGNITY:", "0.00% (Clutching pearls in tears)"),
            ("USER TITLE:", "Certified Roast Master & Royal Slayer"),
            ("RECOVERY PROGNOSIS:", "Banterbot's lawyers are currently drafting lawsuit"),
        ]
    else:
        vitals = [
            ("PRIDE LEVEL:", "0.00% (Absolute Zero)"),
            ("PULSE / DIGNITY:", "Flatlined on arrival"),
            ("RECOVERY PROGNOSIS:", "Permanent emotional damage; therapy advised"),
        ]

    for label, val in vitals:
        draw.text((panel_left + 30, vy), label, font=font_body_bold, fill=text_gold)
        draw.text((panel_left + 350, vy), val, font=font_body, fill=text_white)
        vy += 38

    # 6. Coroner Certification & Footer
    y = height - 140
    draw.line([(panel_left, y), (panel_right, y)], fill=border_inner, width=1)

    y += 18
    signer = "Conceded by: Lord Banterbot III (In Mourning)" if is_win else "Certified by: Lord Banterbot III"
    draw.text((panel_left + 30, y), signer, font=font_body_bold, fill=border_gold)
    draw.text((panel_left + 30, y + 30), "Royal Chief Medical Examiner of Verbal Decapitation", font=font_footer, fill=text_muted)

    right_line1 = "Official Banterbot Arena"
    right_line2 = "Challenge: +1 (415) 595-2354"
    w_r1 = draw.textlength(right_line1, font=font_footer)
    w_r2 = draw.textlength(right_line2, font=font_footer)
    draw.text((panel_right - w_r1 - 30, y), right_line1, font=font_footer, fill=border_gold)
    draw.text((panel_right - w_r2 - 30, y + 30), right_line2, font=font_footer, fill=text_muted)

    # 7. Authentic Angled Rubber Stamp
    stamp_w, stamp_h = 390, 110
    stamp_img = Image.new("RGBA", (stamp_w, stamp_h), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(stamp_img)
    sdraw.rectangle([8, 8, stamp_w - 8, stamp_h - 8], outline=accent_color, width=6)
    sw = sdraw.textlength(stamp_text, font=font_stamp)
    sdraw.text(((stamp_w - sw) / 2, 22), stamp_text, font=font_stamp, fill=accent_color)

    # Rotate 14 degrees
    rotated_stamp = stamp_img.rotate(14, expand=True, resample=Image.BICUBIC)
    img.paste(rotated_stamp, (width - 450, 125), rotated_stamp)

    # Save output as clean RGB PNG
    final_rgb = img.convert("RGB")
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    final_rgb.save(output_path, "PNG")
    print(f"Certificate generated at: {output_path}")

if __name__ == "__main__":
    name = sys.argv[1] if len(sys.argv) > 1 else "Challenger"
    phone = sys.argv[2] if len(sys.argv) > 2 else "+2349060899495"
    cause = sys.argv[3] if len(sys.argv) > 3 else "Acute blunt force trauma from mediocre gas station insults"
    roast = sys.argv[4] if len(sys.argv) > 4 else "I'd roast your fashion sense back, but I'm quite sure your phone's camera would simply refuse to focus out of sheer aesthetic despair."
    out = sys.argv[5] if len(sys.argv) > 5 else "dist/test_certificate.png"
    is_win = (sys.argv[6].lower() == "true") if len(sys.argv) > 6 else False

    generate_certificate(name, phone, cause, roast, out, is_win)
