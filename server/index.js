require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Asd23$'; 
const JWT_SECRET = process.env.JWT_SECRET || 'bare_secret_key_777';

const app = express();
app.use(cors());
app.use(express.json());

// === 1. CLOUDINARY CONFIGURATION ===
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'BARE_Uploads',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
    resource_type: 'auto'
  },
});

const upload = multer({ storage: storage });

// === 2. MIDDLEWARE CONFIG ===
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: "Too many submissions, please try again later."
});
app.use('/api/submit', limiter);

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send("No token provided");
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).send("Unauthorized");
        next();
    });
};

// === 3. ADMIN LOGIN ===
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token });
  }
  res.status(401).send("Invalid Credentials");
});

// === 4. WHOLESALE APPLICATION ROUTE ===
const cpUpload = upload.fields([
  { name: 'businessLicense', maxCount: 1 },
  { name: 'storePhotos', maxCount: 1 },
  { name: 'idPassport', maxCount: 1 },
  { name: 'socialLinks', maxCount: 1 }
]);

app.post('/api/submit', cpUpload, async (req, res) => {
  try {
    const data = req.body;
    const files = req.files || {}; 

    await prisma.wholesaleApplicant.create({
      data: {
        company_name: data.companyName || '',
        reg_number: data.regNumber || '',
        year_established: data.yearEstablished || '',
        business_address: data.businessAddress || '',
        store_address: data.storeAddress || '',
        num_stores: data.numStores || '',
        contact_person: data.contactPerson || '',
        position: data.position || '',
        phone: data.phone || '',
        email: data.email || '',
        comm_method: data.commMethod || '',
        business_type: data.businessType || '',
        sales_channels: data.salesChannels || '',
        customer_segment: data.customerSegment || '',
        interested_products: data.interestedProducts || '',
        monthly_volume: data.monthlyVolume || '',
        preferred_package: data.preferredPackage || '',
        payment_method: data.paymentMethod || '',
        payment_term: data.paymentTerm || '',
        applicant_name: data.applicantName || '',
        signature: data.signature || '',
        declaration_date: data.declarationDate || '',
        business_license_url: files.businessLicense ? files.businessLicense[0].path : null,
        store_photos_url: files.storePhotos ? files.storePhotos[0].path : null,
        id_passport_url: files.idPassport ? files.idPassport[0].path : null,
        social_links_url: files.socialLinks ? files.socialLinks[0].path : null,
      }
    });

    res.status(200).send("Application submitted successfully.");
  } catch (err) {
    res.status(500).send("DB Error: " + err.message);
  }
});

// === 5. INFLUENCER SUBMISSION ===
app.post('/api/submit-influencer', async (req, res) => {
  try {
    const { fullName, phone, email, tiktokLink, instagramLink, followerCounts, ugcExperience, contentSamples, collaborationReason } = req.body;
    
    await prisma.influencer.create({
      data: {
        full_name: fullName || '',
        phone: phone || '',
        email: email || '',
        tiktok_link: tiktokLink || '',
        instagram_link: instagramLink || '',
        follower_counts: followerCounts || '',
        ugc_experience: ugcExperience || '',
        content_samples: contentSamples || '',
        collaboration_reason: collaborationReason || ''
      }
    });
    
    res.status(200).send("Saved");
  } catch (err) {
    res.status(500).send("DB Error");
  }
});

// === 6. UGC CREATOR SUBMISSION ===
app.post('/api/submit-ugc', async (req, res) => {
  try {
    const { fullName, email, phone, shippingAddress, dob, tiktokHandle, instagramHandle, portfolioLink, contentNiche, rates, skinType, skinTone, skinConcerns } = req.body;
    const nicheString = Array.isArray(contentNiche) ? JSON.stringify(contentNiche) : contentNiche;
    const concernsString = Array.isArray(skinConcerns) ? JSON.stringify(skinConcerns) : skinConcerns;
    
    await prisma.ugcCreator.create({
      data: {
        full_name: fullName || '',
        email: email || '',
        phone: phone || '',
        shipping_address: shippingAddress || '',
        dob: dob || '',
        tiktok_handle: tiktokHandle || '',
        instagram_handle: instagramHandle || '',
        portfolio_link: portfolioLink || '',
        content_niche: nicheString || '',
        rates: rates || '',
        skin_type: skinType || '',
        skin_tone: skinTone || '',
        skin_concerns: concernsString || ''
      }
    });

    res.status(200).send("UGC Application Submitted");
  } catch (err) {
    res.status(500).send("DB Error");
  }
});

// === 7. JOB APPLICATION SUBMISSION ===
app.post('/api/submit-job', upload.single('resume'), async (req, res) => {
  try {
    const { fullName, email, phone, linkedinUrl, position, salary, startDate, coverLetter } = req.body;
    const resumeUrl = req.file ? req.file.path : null;
    
    if (!resumeUrl) return res.status(400).send("Resume is required.");
    
    await prisma.jobApplicant.create({
      data: {
        full_name: fullName || '',
        email: email || '',
        phone: phone || '',
        linkedin_url: linkedinUrl || '',
        position_applied: position || '',
        expected_salary: salary || '',
        start_date: startDate || '',
        resume_url: resumeUrl || '',
        cover_letter: coverLetter || ''
      }
    });

    res.status(200).send("Job Application Submitted");
  } catch (err) {
    res.status(500).send("DB Error");
  }
});

// === 8. ADMIN DATA FETCHING ===
app.get('/api/applicants', verifyToken, async (req, res) => {
  try {
    const data = await prisma.wholesaleApplicant.findMany({ orderBy: { created_at: 'desc' } });
    res.json(data);
  } catch (err) { res.status(500).send("DB Error"); }
});

app.get('/api/influencers', verifyToken, async (req, res) => {
  try {
    const data = await prisma.influencer.findMany({ orderBy: { created_at: 'desc' } });
    res.json(data);
  } catch (err) { res.status(500).send("DB Error"); }
});

app.get('/api/ugc', verifyToken, async (req, res) => {
  try {
    const data = await prisma.ugcCreator.findMany({ orderBy: { created_at: 'desc' } });
    res.json(data);
  } catch (err) { res.status(500).send("DB Error"); }
});

app.get('/api/jobs', verifyToken, async (req, res) => {
  try {
    const data = await prisma.jobApplicant.findMany({ orderBy: { created_at: 'desc' } });
    res.json(data);
  } catch (err) { res.status(500).send("DB Error"); }
});

// === 9. POSITIONS (ROLES) ===
app.get('/api/positions', async (req, res) => {
  try {
    const data = await prisma.position.findMany({ orderBy: { title: 'asc' } });
    res.json(data);
  } catch (err) { res.status(500).send("DB Error"); }
});

app.post('/api/positions', verifyToken, async (req, res) => {
  try {
    const newRole = await prisma.position.create({ data: { title: req.body.title } });
    res.json({ id: newRole.id, title: newRole.title });
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

app.put('/api/positions/:id', verifyToken, async (req, res) => {
  try {
    await prisma.position.update({
      where: { id: Number(req.params.id) },
      data: { title: req.body.title }
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

app.delete('/api/positions/:id', verifyToken, async (req, res) => {
  try {
    await prisma.position.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

// === 10. STATUS UPDATES & DELETION ===
const handleStatusUpdate = async (model, req, res) => {
  try {
    await prisma[model].update({
      where: { id: Number(req.params.id) },
      data: { status: req.body.status }
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
};

const handleDelete = async (model, req, res) => {
  try {
    await prisma[model].delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
};

app.put('/api/applicants/:id/status', verifyToken, (req, res) => handleStatusUpdate('wholesaleApplicant', req, res));
app.delete('/api/applicants/:id', verifyToken, (req, res) => handleDelete('wholesaleApplicant', req, res));

app.put('/api/influencers/:id/status', verifyToken, (req, res) => handleStatusUpdate('influencer', req, res));
app.delete('/api/influencers/:id', verifyToken, (req, res) => handleDelete('influencer', req, res));

app.put('/api/ugc/:id/status', verifyToken, (req, res) => handleStatusUpdate('ugcCreator', req, res));
app.delete('/api/ugc/:id', verifyToken, (req, res) => handleDelete('ugcCreator', req, res));

app.put('/api/jobs/:id/status', verifyToken, (req, res) => handleStatusUpdate('jobApplicant', req, res));
app.delete('/api/jobs/:id', verifyToken, (req, res) => handleDelete('jobApplicant', req, res));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));