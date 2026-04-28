import jsPDF from 'jspdf';

// === 1. HELPER: Image Downloader (For the filled PDF) ===
const getImageData = async (url) => {
    if (!url) return null;
    try {
        const cleanPath = url.replace(/\\/g, '/');
        // Handle Local File Objects (from upload form)
        if (url instanceof File) {
             return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                     const img = new Image();
                     img.src = reader.result;
                     img.onload = () => resolve({ base64: reader.result, width: img.width, height: img.height });
                };
                reader.readAsDataURL(url);
            });
        }
        // Handle Server URLs
        const fullUrl = cleanPath.startsWith('http') ? cleanPath : `http://localhost:3001/${cleanPath}`;
        const response = await fetch(fullUrl);
        if (!response.ok) throw new Error("Image not found");
        const blob = await response.blob();
        
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result;
                const img = new Image();
                img.src = base64;
                img.onload = () => resolve({ base64: base64, width: img.width, height: img.height });
            };
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error loading image:", url, error);
        return null;
    }
};

// === 2. GENERATE OFFICIAL PDF (Filled with Data) ===
export const generateOfficialPDF = async (item) => {
    const doc = new jsPDF();

    const drawCheckbox = (label, x, y, isChecked) => {
        doc.setDrawColor(0);
        doc.setFillColor(255, 255, 255);
        doc.rect(x, y, 4, 4); 
        if (isChecked) {
            doc.setLineWidth(0.5);
            doc.line(x + 0.8, y + 2.2, x + 1.8, y + 3.2); 
            doc.line(x + 1.8, y + 3.2, x + 3.5, y + 0.8); 
        }
        doc.setFontSize(10);
        doc.setFont("times", "normal"); 
        doc.text(label, x + 6, y + 3.5);
    };

    const drawLineField = (label, value, y) => {
        doc.setFontSize(10);
        doc.setFont("times", "normal");
        doc.text(label, 20, y);
        doc.line(20, y + 2, 190, y + 2);
        if (value) {
            doc.setFont("times", "bold");
            doc.text(String(value), 80, y);
        }
    };

    const drawSectionHeader = (text, y, fontSize = 10) => {
        doc.setFillColor(230, 230, 230);
        const boxHeight = fontSize > 12 ? 10 : 8;
        doc.rect(20, y, 170, boxHeight, 'F');
        doc.setFontSize(fontSize);
        doc.setFont("times", "bold");
        doc.setTextColor(0, 0, 0);
        const yOffset = fontSize > 12 ? 7 : 5.5;
        doc.text(text, 105, y + yOffset, { align: "center" });
        return boxHeight;
    };

    // PAGE 1
    doc.setFontSize(22);
    doc.setFont("times", "bold");
    doc.text("WHOLESALE", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("APPLICATION FORM", 105, 28, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("times", "normal");
    doc.text(`Date: ${new Date(item.created_at || Date.now()).toLocaleDateString()}`, 20, 40);
    doc.text("Wholesale Type (filled by Company): _________________", 20, 48);

    drawSectionHeader("A. APPLICANT INFORMATION", 55);
    let y = 75;
    drawLineField("Registered Company Name:", item.company_name, y); y += 15;
    drawLineField("Business Registration Number:", item.reg_number, y); y += 15;
    drawLineField("Year Established:", item.year_established || "2024", y); y += 15;
    drawLineField("Registered Business Address:", item.business_address || "", y); y += 15;
    drawLineField("Physical Store Address (if different):", item.store_address || "", y); y += 15;
    doc.setFont("times", "bold");
    doc.text("Number of Physical Stores:", 20, y); 
    const storeCount = item.num_stores || ""; 
    drawCheckbox("1", 70, y-4, storeCount === "1");
    drawCheckbox("2-3", 90, y-4, storeCount === "2-3");
    const isMore = storeCount.includes("More");
    drawCheckbox("More than 3", 110, y-4, isMore);
    if (isMore) {
        const match = storeCount.match(/\(([^)]+)\)/);
        const exactNumber = match ? match[1] : ""; 
        doc.setFont("times", "normal");
        doc.text("Exact Qty:", 145, y);
        doc.setFont("times", "bold");
        doc.text(exactNumber, 165, y);
        doc.line(165, y+1, 175, y+1);
    }
    y += 20;
    drawSectionHeader("B. CONTACT DETAILS", y); y += 20;
    drawLineField("Authorized Contact Person:", item.contact_person, y); y += 15;
    drawLineField("Position / Title:", item.position || "Owner / Manager", y); y += 15;
    drawLineField("Phone Number:", item.phone, y); y += 20;
    doc.setFontSize(9);
    doc.text("Page | 1", 190, 285, { align: "right" });

    // PAGE 2
    doc.addPage();
    y = 20;
    drawLineField("Email Address:", item.email, y); y += 15;
    doc.setFont("times", "bold");
    doc.text("Preferred Communication Method:", 20, y);
    const comms = item.comm_method || ""; 
    drawCheckbox("Phone", 80, y-4, comms.includes("Phone"));
    drawCheckbox("Email", 100, y-4, comms.includes("Email"));
    drawCheckbox("Telegram App:", 120, y-4, comms.includes("Telegram"));
    if(comms.includes("Telegram")) {
        doc.line(165, y+1, 190, y+1);
        doc.setFont("times", "bold");
        doc.text(item.phone, 168, y);
    }
    y += 15;
    drawSectionHeader("C. BUSINESS PROFILE", y); y += 20;
    doc.setFont("times", "bold");
    doc.text("Business Type (please tick):", 20, y); y += 8;
    const bType = item.business_type || "";
    drawCheckbox("Cosmetic Retail Store", 20, y-4, bType.includes("Cosmetic")); y += 7;
    drawCheckbox("Clinic / Pharmacy", 20, y-4, bType.includes("Pharmacy")); y += 7;
    drawCheckbox("Department Store", 20, y-4, bType.includes("Department")); y += 7;
    drawCheckbox("Distributor / Wholesaler", 20, y-4, bType.includes("Distributor")); y += 7;
    drawCheckbox("Salon / Beauty Service", 20, y-4, bType.includes("Salon")); y += 7;
    drawCheckbox("Other: _______________________", 20, y-4, false); y += 12;
    doc.text("Primary Sales Channels (tick all that apply):", 20, y); y += 8;
    const sales = item.sales_channels || "";
    drawCheckbox("Physical Store", 20, y-4, sales.includes("Physical")); y += 7;
    drawCheckbox("Social Media", 20, y-4, sales.includes("Social")); y += 7;
    drawCheckbox("E-commerce / Online", 20, y-4, sales.includes("Online")); y += 12;
    doc.text("Target Customer Segment:", 20, y); y += 8;
    const segment = item.customer_segment || "";
    drawCheckbox("Mass Market", 20, y-4, segment.includes("Mass")); y += 7;
    drawCheckbox("Mid-range", 20, y-4, segment.includes("Mid")); y += 7;
    drawCheckbox("Premium", 20, y-4, segment.includes("Premium")); y += 7;
    drawCheckbox("Professional / Clinical", 20, y-4, segment.includes("Professional")); y += 12;
    drawSectionHeader("D. WHOLESALE INTEREST", y); y += 20;
    doc.text("Products Interested In (tick all that apply):", 20, y); y += 8;
    const pInterest = item.interested_products || "";
    drawCheckbox("Skincare", 20, y-4, pInterest.includes("Skincare")); y += 7;
    drawCheckbox("Cosmetics", 20, y-4, pInterest.includes("Cosmetics")); y += 7;
    drawCheckbox("Sunscreen", 20, y-4, pInterest.includes("Sunscreen")); y += 7;
    drawCheckbox("Accessories", 20, y-4, pInterest.includes("Accessories")); y += 7;
    drawCheckbox("Other: _______________________", 20, y-4, pInterest.includes("Other")); y += 15;
    drawLineField("Estimated Monthly Order Volume:", item.monthly_volume || "$1,000 - $5,000", y);
    doc.setFontSize(9);
    doc.text("Page | 2", 190, 285, { align: "right" });

    // PAGE 3
    doc.addPage();
    y = 20;
    doc.setFont("times", "bold");
    doc.text("Preferred Wholesale Package:", 20, y); y += 8;
    const pkg = item.preferred_package || "";
    drawCheckbox("Starter Package", 20, y-4, pkg.includes("Starter")); y += 7;
    drawCheckbox("Premium Package", 20, y-4, pkg.includes("Premium")); y += 7;
    drawCheckbox("Custom Discussion", 20, y-4, pkg.includes("Custom")); y += 15;
    drawSectionHeader("E. PAYMENT & COMMERCIAL INFORMATION", y); y += 20;
    
    doc.setFont("times", "bold");
    doc.text("Preferred Payment Method:", 20, y); y += 8;
    const pay = item.payment_method || "";
    drawCheckbox("Bank Transfer", 20, y-4, pay.includes("Bank")); y += 7;
    drawCheckbox("Cash", 20, y-4, pay.includes("Cash")); y += 7;
    drawCheckbox("Other (subject to approval): _______________________", 20, y-4, pay.includes("Other")); y += 15;

    // Payment Term (NEW)
    doc.setFont("times", "bold");
    doc.text("Requested Payment Term:", 20, y); y += 8;
    const term = item.payment_term || "";
    drawCheckbox("Prepaid", 20, y-4, term.includes("Prepaid")); y += 7;
    drawCheckbox("Deposit + Balance Before Delivery", 20, y-4, term.includes("Deposit")); y += 7;
    drawCheckbox("Other (subject to approval): _______________________", 20, y-4, term.includes("Other")); y += 15;

    drawSectionHeader("F. REQUIRED SUPPORTING DOCUMENTS", y); y += 20;
    doc.setFont("times", "normal");
    doc.text("(Please attach copies)", 20, y); y += 8;
    drawCheckbox("Business Registration / License", 20, y-4, !!item.business_license_url); y += 7;
    drawCheckbox("Store Photos (Interior & Exterior)", 20, y-4, !!item.store_photos_url); y += 7;
    drawCheckbox("ID / Passport of Authorized Signatory", 20, y-4, !!item.id_passport_url); y += 7;
    drawCheckbox("Social Media or Website Links", 20, y-4, !!item.social_links_url); y += 15;
    
    doc.setFontSize(9);
    doc.text("Page | 3", 190, 285, { align: "right" });

    // PAGE 4 (Declaration & Internal Use)
    doc.addPage();
    y = 20;
    
    const gHeight = drawSectionHeader("G. DECLARATION & ACKNOWLEDGEMENT", y, 14); 
    y += gHeight + 12; 
    doc.setFontSize(9);
    doc.setFont("times", "normal");
    doc.text("I hereby confirm that all information provided in this Wholesale Application Form is true,", 20, y); y+=5;
    doc.text("accurate, and complete. I acknowledge that submission of this form does not guarantee", 20, y); y+=5;
    doc.text("approval. I agree to comply with all Terms & Conditions, Wholesale Policies, and pricing", 20, y); y+=5;
    doc.text("regulations set forth by B.A.R.E Trading Co., Ltd.", 20, y); y+=20;
    drawLineField("Applicant Name:", item.applicant_name || item.contact_person, y); y += 15; 
    drawLineField("Signature:", `(Digitally Signed: ${item.signature})`, y); y += 15; 
    drawLineField("Date:", new Date(item.declaration_date || item.created_at).toLocaleDateString(), y);
    y += 20;

    drawSectionHeader("H. INTERNAL USE ONLY", y); y += 30;
    drawLineField("Application fee:", "Waived", y); y += 20;
    drawLineField("Special Notes:", "", y); y += 10;
    doc.line(20, y, 190, y); y += 30;
    doc.setLineDash([2, 2]); 
    doc.rect(20, y, 80, 50); 
    doc.rect(110, y, 80, 50); 
    doc.setLineDash([]); 
    doc.setFontSize(9);
    doc.setFont("times", "bold");
    doc.text("Checked & Processed By:", 25, y+8);
    doc.setFont("times", "normal");
    doc.text("Name: ______________________", 25, y+20);
    doc.text("Position: ____________________", 25, y+28);
    doc.text("Signature: ___________________", 25, y+38);
    doc.text("Date: _______________________", 25, y+46);
    doc.setFont("times", "bold");
    doc.text("Checked & Approved By:", 115, y+8);
    doc.setFont("times", "normal");
    doc.text("Name: ______________________", 115, y+20);
    doc.text("Position: ____________________", 115, y+28);
    doc.text("Signature: ___________________", 115, y+38);
    doc.text("Date: _______________________", 115, y+46);
    doc.text("Page | 4", 190, 285, { align: "right" });

    // PAGE 5 (Attachments)
    doc.addPage();
    y = 20;
    drawSectionHeader("I. ATTACHED DOCUMENTS", y); y += 20;
    const drawImageBlock = (label, imgObj, x, y) => {
        doc.setFont("times", "bold");
        doc.setFontSize(10);
        doc.text(label, x, y - 3);
        doc.setDrawColor(0);
        doc.rect(x, y, 80, 100); 
        if (imgObj && imgObj.base64) {
            const boxW = 80; const boxH = 100;
            const scaleFactor = Math.min(boxW / imgObj.width, boxH / imgObj.height);
            const finalW = imgObj.width * scaleFactor;
            const finalH = imgObj.height * scaleFactor;
            const centeredX = x + (boxW - finalW) / 2;
            const centeredY = y + (boxH - finalH) / 2;
            doc.addImage(imgObj.base64, 'JPEG', centeredX, centeredY, finalW, finalH);
        } else {
            doc.setFillColor(245, 245, 245);
            doc.rect(x + 1, y + 1, 78, 98, 'F'); 
            doc.setFont("times", "italic");
            doc.setTextColor(150);
            doc.text("(No Image)", x + 40, y + 50, { align: "center" });
            doc.setTextColor(0); 
        }
    };
    const img1 = await getImageData(item.business_license_url || item.business_license);
    const img2 = await getImageData(item.store_photos_url || item.store_photos);
    const img3 = await getImageData(item.id_passport_url || item.id_passport);
    const img4 = await getImageData(item.social_links_url || item.social_links);
    drawImageBlock("1. Business License", img1, 20, y);
    drawImageBlock("2. Store Photo", img2, 110, y);
    y += 115; 
    drawImageBlock("3. ID / Passport", img3, 20, y);
    drawImageBlock("4. Social Media / Website", img4, 110, y);
    doc.setFontSize(9);
    doc.text("Page | 5", 190, 285, { align: "right" });

    doc.save(`BARE_Wholesale_Form_${item.company_name.replace(/\s+/g, '_')}.pdf`);
};

// === 3. GENERATE BLANK PDF (For Printing) ===
// NOTE: This version does NOT use 'item' variables because the form is blank.
export const generateBlankPDF = () => {
    const doc = new jsPDF();

    const drawCheckbox = (label, x, y) => {
        doc.setDrawColor(0);
        doc.setFillColor(255, 255, 255);
        doc.rect(x, y, 4, 4); 
        doc.setFontSize(10);
        doc.setFont("times", "normal"); 
        doc.text(label, x + 6, y + 3.5);
    };

    const drawLineField = (label, y) => {
        doc.setFontSize(10);
        doc.setFont("times", "normal");
        doc.text(label, 20, y);
        doc.line(20, y + 2, 190, y + 2); 
    };

    const drawSectionHeader = (text, y, fontSize = 10) => {
        doc.setFillColor(230, 230, 230);
        const boxHeight = fontSize > 12 ? 10 : 8;
        doc.rect(20, y, 170, boxHeight, 'F');
        doc.setFontSize(fontSize);
        doc.setFont("times", "bold");
        doc.setTextColor(0, 0, 0);
        const yOffset = fontSize > 12 ? 7 : 5.5;
        doc.text(text, 105, y + yOffset, { align: "center" });
        return boxHeight;
    };

    // PAGE 1
    doc.setFontSize(22);
    doc.setFont("times", "bold");
    doc.text("WHOLESALE", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("APPLICATION FORM", 105, 28, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("times", "normal");
    doc.text("Date: _______________________", 20, 40);
    doc.text("Wholesale Type (filled by Company): _________________", 20, 48);

    drawSectionHeader("A. APPLICANT INFORMATION", 55);
    let y = 75;
    drawLineField("Registered Company Name:", y); y += 15;
    drawLineField("Business Registration Number:", y); y += 15;
    drawLineField("Year Established:", y); y += 15;
    drawLineField("Registered Business Address:", y); y += 15;
    drawLineField("Physical Store Address (if different):", y); y += 15;
    doc.setFont("times", "bold");
    doc.text("Number of Physical Stores:", 20, y); 
    drawCheckbox("1", 70, y-4);
    drawCheckbox("2-3", 90, y-4);
    drawCheckbox("More than 3", 110, y-4);
    y += 20;
    drawSectionHeader("B. CONTACT DETAILS", y); y += 20;
    drawLineField("Authorized Contact Person:", y); y += 15;
    drawLineField("Position / Title:", y); y += 15;
    drawLineField("Phone Number:", y); y += 20;
    doc.setFontSize(9);
    doc.text("Page | 1", 190, 285, { align: "right" });

    // PAGE 2
    doc.addPage();
    y = 20;
    drawLineField("Email Address:", y); y += 15;
    doc.setFont("times", "bold");
    doc.text("Preferred Communication Method:", 20, y);
    drawCheckbox("Phone", 80, y-4);
    drawCheckbox("Email", 100, y-4);
    drawCheckbox("Telegram App (ID): ___________________", 120, y-4);
    y += 15;
    drawSectionHeader("C. BUSINESS PROFILE", y); y += 20;
    doc.setFont("times", "bold");
    doc.text("Business Type (please tick):", 20, y); y += 8;
    drawCheckbox("Cosmetic Retail Store", 20, y-4); y += 7;
    drawCheckbox("Clinic / Pharmacy", 20, y-4); y += 7;
    drawCheckbox("Department Store", 20, y-4); y += 7;
    drawCheckbox("Distributor / Wholesaler", 20, y-4); y += 7;
    drawCheckbox("Salon / Beauty Service", 20, y-4); y += 7;
    drawCheckbox("Other: _______________________", 20, y-4); y += 12;
    doc.text("Primary Sales Channels (tick all that apply):", 20, y); y += 8;
    drawCheckbox("Physical Store", 20, y-4); y += 7;
    drawCheckbox("Social Media (supporting sales only)", 20, y-4); y += 7;
    drawCheckbox("E-commerce / Online Platform", 20, y-4); y += 12;
    doc.text("Target Customer Segment:", 20, y); y += 8;
    drawCheckbox("Mass Market", 20, y-4); y += 7;
    drawCheckbox("Mid-range", 20, y-4); y += 7;
    drawCheckbox("Premium", 20, y-4); y += 7;
    drawCheckbox("Professional / Clinical", 20, y-4); y += 12;
    drawSectionHeader("D. WHOLESALE INTEREST", y); y += 20;
    doc.text("Products Interested In (tick all that apply):", 20, y); y += 8;
    drawCheckbox("Skincare", 20, y-4); y += 7;
    drawCheckbox("Cosmetics", 20, y-4); y += 7;
    drawCheckbox("Sunscreen", 20, y-4); y += 7;
    drawCheckbox("Accessories / Packaging", 20, y-4); y += 7;
    drawCheckbox("Other: _______________________", 20, y-4); y += 15;
    drawLineField("Estimated Monthly Order Volume:", y);
    doc.setFontSize(9);
    doc.text("Page | 2", 190, 285, { align: "right" });

    // PAGE 3
    doc.addPage();
    y = 20;
    doc.setFont("times", "bold");
    doc.text("Preferred Wholesale Package:", 20, y); y += 8;
    drawCheckbox("Starter Package", 20, y-4); y += 7;
    drawCheckbox("Premium Package", 20, y-4); y += 7;
    drawCheckbox("Custom Discussion", 20, y-4); y += 15;
    drawSectionHeader("E. PAYMENT & COMMERCIAL INFORMATION", y); y += 20;
    doc.text("Preferred Payment Method:", 20, y); y += 8;
    drawCheckbox("Bank Transfer", 20, y-4); y += 7;
    drawCheckbox("Cash", 20, y-4); y += 7;
    drawCheckbox("Other: _______________________", 20, y-4); y += 15;

    doc.text("Requested Payment Term:", 20, y); y += 8;
    drawCheckbox("Prepaid", 20, y-4); y += 7;
    drawCheckbox("Deposit + Balance Before Delivery", 20, y-4); y += 7;
    drawCheckbox("Other (subject to approval): _______________________", 20, y-4); y += 15;

    drawSectionHeader("F. REQUIRED SUPPORTING DOCUMENTS", y); y += 20;
    doc.setFont("times", "normal");
    doc.text("(Please attach copies)", 20, y); y += 8;
    drawCheckbox("Business Registration / License", 20, y-4); y += 7;
    drawCheckbox("Store Photos (Interior & Exterior)", 20, y-4); y += 7;
    drawCheckbox("ID / Passport of Authorized Signatory", 20, y-4); y += 7;
    drawCheckbox("Social Media or Website Links", 20, y-4); y += 15;

    doc.setFontSize(9);
    doc.text("Page | 3", 190, 285, { align: "right" });

    // PAGE 4 (Declaration & Internal Use)
    doc.addPage();
    y = 20;
    const gHeight = drawSectionHeader("G. DECLARATION & ACKNOWLEDGEMENT", y, 14); 
    y += gHeight + 12; 
    doc.setFontSize(9);
    doc.setFont("times", "normal");
    doc.text("I hereby confirm that all information provided in this Wholesale Application Form is true,", 20, y); y+=5;
    doc.text("accurate, and complete. I acknowledge that submission of this form does not guarantee", 20, y); y+=5;
    doc.text("approval. I agree to comply with all Terms & Conditions, Wholesale Policies, and pricing", 20, y); y+=5;
    doc.text("regulations set forth by B.A.R.E Trading Co., Ltd.", 20, y); y+=20;
    drawLineField("Applicant Name:", y); y += 15; 
    drawLineField("Signature:", y); y += 15; 
    drawLineField("Date:", y);
    y += 20;

    drawSectionHeader("H. INTERNAL USE ONLY", y); y += 30;
    drawLineField("Application fee:", y); y += 20;
    drawLineField("Special Notes:", y); y += 10;
    doc.line(20, y, 190, y); y += 30;
    doc.setLineDash([2, 2]); 
    doc.rect(20, y, 80, 50); 
    doc.rect(110, y, 80, 50); 
    doc.setLineDash([]); 
    doc.setFontSize(9);
    doc.setFont("times", "bold");
    doc.text("Checked & Processed By:", 25, y+8);
    doc.setFont("times", "normal");
    doc.text("Name: ______________________", 25, y+20);
    doc.text("Position: ____________________", 25, y+28);
    doc.text("Signature: ___________________", 25, y+38);
    doc.text("Date: _______________________", 25, y+46);
    doc.setFont("times", "bold");
    doc.text("Checked & Approved By:", 115, y+8);
    doc.setFont("times", "normal");
    doc.text("Name: ______________________", 115, y+20);
    doc.text("Position: ____________________", 115, y+28);
    doc.text("Signature: ___________________", 115, y+38);
    doc.text("Date: _______________________", 115, y+46);
    doc.text("Page | 4", 190, 285, { align: "right" });

    doc.save("BARE_Wholesale_Form_Blank.pdf");
};