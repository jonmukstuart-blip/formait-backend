import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.put("/:id/reply", protect, async (req, res) => {
  try {
    const { reply } = req.body;

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // 1. Save reply in database
    lead.reply = reply;
    lead.repliedAt = new Date();
    await lead.save();

        await transporter.sendMail({
      from: `"FORMA.IT" <${process.env.EMAIL_USER}>`,
      to: lead.email,
      subject: "Reply from FORMA.IT",
      text: `
Hi ${lead.name},

Thanks for contacting FORMA.IT.

Our response:
${reply}

— FORMA.IT Team
      `,
    });

    res.json({ message: "Reply sent successfully", lead });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

