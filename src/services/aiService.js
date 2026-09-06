import { db } from "../firebase/config";
import { collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp } from "firebase/firestore";

/** Optimized for exact specialty matching with all 21 registered categories.
 */

const MIN_CONFIDENCE = 20; 
const MAX_CHARS = 500;
const COOLDOWN_MINUTES = 1;

const STEM_WHITELIST = ["diabetes", "gas", "measles", "arthritis", "stasis", "psoriasis"];

const HINGLISH_MAP = {
  // Chest / Heart
  "seene": "chest", "seena": "chest", "dard": "pain", "saans": "breathing",
  "dhadkan": "palpitation", "dharkan": "palpitation", "ghabrahat": "panic",
  
  // Head / Brain / Mental
  "sar": "head", "sir": "head", "chakkar": "dizzy", "tanaav": "stress",
  "chinta": "anxiety", "gussa": "ganger", "udaas": "sad", "udaasi": "depression",
  "neend": "sleep", "dimag": "brain", "dimaag": "brain", "nas": "nerve",
  "mirgi": "seizure", "sunn": "numbness",

  // Skin
  "khujli": "itch", "dane": "rash", "daane": "rash", "pimple": "acne",
  "chamdi": "skin", "laal": "red",

  // Digestion
  "pet": "stomach", "pait": "stomach", "gas": "gas", "acidity": "acidity",
  "dast": "diarrhea", "kabz": "constipation", "ulti": "vomit",

  // Bone / Joint / Muscles
  "haddi": "bone", "moch": "sprain", "ghutna": "knee", "ghutne": "knee",
  "kamar": "back", "jod": "joint", "jodo": "joint", "jakdan": "stiffness",

  // Eye / Vision
  "aankh": "eye", "aankhein": "eye", "dhundhla": "blurry",

  // Children
  "bacha": "child", "bachha": "child", "shishu": "child",

  // ENT
  "kaan": "ear", "naak": "nose", "gala": "throat", "khansi": "cough",
  "bukhaar": "fever", "bukhar": "fever",

  // Urine / Kidney
  "peshab": "urine", "pathri": "stone", "khoon": "blood", "sujan": "swelling",
  "pairon": "legs",

  // Cancer
  "ganth": "lump", "gath": "lump",

  // Female
  "mahavari": "period", "pregnant": "pregnancy", "pregnancy": "pregnancy",
  "gupt": "sexual", "rog": "concern"
};

const SEVERITY_MODIFIERS = {
  high: ["severe", "sudden", "unbearable", "intense", "bahut zyada", "tez", "emergency"],
  low: ["mild", "slight", "minor", "thoda", "kabhi kabhi"]
};

const EMERGENCY_KEYWORDS = [
  "unconscious", "seizure", "blood vomiting", "heavy bleeding", 
  "heart attack", "cannot breathe", "shortness of breath", "chest pain",
  "mirgi", "seene me tez dard"
];

const SYMPTOM_RULES = [
  {
    id: "cardiology",
    keywords: ["heart", "chest", "palpitation", "arrhythmia", "dhadkan", "seena", "angina"],
    aliases: ["chest pain", "heart pain", "chest tightness", "breathing tightness", "irregular heartbeat", "seene me dard", "left arm pain"],
    specialty: { en: "Cardiologist", hi: "Cardiologist" },
    possibleIssues: { en: ["Angina", "Arrhythmia", "Cardiac evaluation required"], hi: ["एनजाइना", "अतालता", "हृदय मूल्यांकन की आवश्यकता है"] },
    precautions: { en: ["Rest immediately", "Avoid physical exertion", "Seek emergency help if pain persists"], hi: ["तुरंत आराम करें", "शारीरिक परिश्रम से बचें", "यदि दर्द बना रहता है तो आपातकालीन सहायता लें"] },
    baseSeverity: "high"
  },
  {
    id: "dermatology",
    keywords: ["skin", "rash", "itch", "pimple", "acne", "khujli", "eczema", "psoriasis", "dane", "daane"],
    aliases: ["skin allergy", "red spots", "itching skin", "skin redness", "dry skin", "pimple problem", "khujli hona", "skin infection"],
    specialty: { en: "Dermatologist", hi: "Dermatologist" },
    possibleIssues: { en: ["Eczema", "Acne vulgaris", "Fungal skin infection", "Skin allergy"], hi: ["एक्जिमा", "मुँहासे", "त्वचा का फंगल संक्रमण", "त्वचा की एलर्जी"] },
    precautions: { en: ["Do not scratch or pop pimples", "Keep the affected area clean and dry", "Apply mild soothing moisturizer"], hi: ["खुजली न करें या पिंपल्स न फोड़ें", "प्रभावित क्षेत्र को साफ और सूखा रखें", "हल्का सुखदायक मॉइस्चराइज़र लगाएं"] },
    baseSeverity: "low"
  },
  {
    id: "neurology",
    keywords: ["headache", "migraine", "dizzy", "nerve", "seizure", "tremor", "sar", "chakkar", "mirgi", "nas", "numbness"],
    aliases: ["severe headache", "dizziness", "nerve pain", "migraine pain", "blurred vision", "fainting spell", "sar me dard", "chakkar aana", "naso me dard"],
    specialty: { en: "Neurologist", hi: "Neurologist" },
    possibleIssues: { en: ["Migraine", "Tension headache", "Neuropathy", "Nerve compression"], hi: ["माइग्रेन", "तनाव सिरदर्द", "न्यूरोपैथी", "तंत्रिका संपीड़न"] },
    precautions: { en: ["Rest in a quiet dark room", "Stay well hydrated", "Avoid bright screens and loud noises", "Monitor coordination and speech"], hi: ["शांत अंधेरे कमरे में आराम करें", "अच्छी तरह से हाइड्रेट रहें", "चमकदार स्क्रीन और तेज आवाज से बचें", "समन्वय और भाषण की निगरानी करें"] },
    baseSeverity: "medium"
  },
  {
    id: "dentistry",
    keywords: ["tooth", "teeth", "gum", "cavity", "daant", "dant", "masuda"],
    aliases: ["toothache", "bleeding gums", "tooth pain", "tooth sensitivity", "dental pain", "daant me dard", "dant me dard", "masude me sujan"],
    specialty: { en: "Dentist", hi: "Dentist" },
    possibleIssues: { en: ["Dental cavity", "Gingivitis", "Tooth decay", "Tooth sensitivity"], hi: ["दांत की कैविटी", "मसूड़ों की सूजन", "दांतों का सड़ना", "दांतों की संवेदनशीलता"] },
    precautions: { en: ["Rinse with warm salt water", "Avoid extremely cold, hot, or sweet items", "Brush gently twice daily", "Do not chew on the painful side"], hi: ["गुनगुने नमक के पानी से कुल्ला करें", "अत्यधिक ठंडी, गर्म या मीठी चीजों से बचें", "दिन में दो बार धीरे से ब्रश करें", "दर्द वाली तरफ से न चबाएं"] },
    baseSeverity: "low"
  },
  {
    id: "gastroenterology",
    keywords: ["stomach", "vomit", "acid", "gas", "indigestion", "diarrhea", "constipation", "pet", "dast", "kabz", "ulti", "bloating"],
    aliases: ["stomach ache", "acidity", "acid reflux", "nausea", "vomiting", "heartburn", "pet me dard", "gas ki samasya", "pet dard"],
    specialty: { en: "Gastroenterologist", hi: "Gastroenterologist" },
    possibleIssues: { en: ["Gastritis", "Food poisoning", "Acid reflux (GERD)", "Gastroenteritis"], hi: ["गैस्ट्राइटिस", "फूड पॉइजनिंग", "एसिड रिफ्लक्स", "गैस्ट्रोएंटेराइटिस"] },
    precautions: { en: ["Avoid spicy, oily, and heavy foods", "Drink plenty of water or ORS", "Eat light, small meals", "Do not lie down immediately after eating"], hi: ["मसालेदार, तैलीय और भारी भोजन से बचें", "भरपूर पानी या ओआरएस पिएं", "हल्का और कम भोजन करें", "खाने के तुरंत बाद न लेटें"] },
    baseSeverity: "medium"
  },
  {
    id: "orthopedics",
    keywords: ["bone", "joint", "fracture", "muscle", "sprain", "strain", "knee", "back", "haddi", "moch", "ghutna", "kamar", "jod", "stiffness"],
    aliases: ["back pain", "joint pain", "knee pain", "muscle sprain", "bone fracture", "haddi tootna", "kamar dard", "ghutne me dard", "jodo me dard"],
    specialty: { en: "Orthopedic", hi: "Orthopedic" },
    possibleIssues: { en: ["Ligament sprain", "Muscle strain", "Osteoarthritis", "Joint inflammation"], hi: ["लिगामेंट में खिंचाव", "मांसपेशियों में खिंचाव", "ऑस्टियोआर्थराइटिस", "जोड़ों की सूजन"] },
    precautions: { en: ["Rest the affected area", "Apply ice or cold compress", "Avoid heavy lifting or physical strain", "Elevate the limb if swollen"], hi: ["प्रभावित हिस्से को आराम दें", "बर्फ या ठंडी सिकाई लगाएं", "भारी वजन उठाने या शारीरिक खिंचाव से बचें", "सूजन होने पर अंग को ऊपर उठाएं"] },
    baseSeverity: "medium"
  },
  {
    id: "ophthalmology",
    keywords: ["eye", "vision", "blurry", "redness", "aankh", "aankhein"],
    aliases: ["eye pain", "red eyes", "itching in eye", "blurry vision", "double vision", "dry eyes", "aankh me dard", "dhundhla dikhna", "aankhein laal hona"],
    specialty: { en: "Ophthalmologist", hi: "Ophthalmologist" },
    possibleIssues: { en: ["Conjunctivitis (Pink eye)", "Refractive error", "Dry eye syndrome"], hi: ["कंजंक्टिवाइटिस (आंख आना)", "दृष्टि दोष", "सूखी आंखें"] },
    precautions: { en: ["Avoid rubbing your eyes", "Limit screen time", "Rinse eyes with clean water", "Remove contact lenses immediately"], hi: ["आँखें रगड़ने से बचें", "स्क्रीन टाइम सीमित करें", "साफ पानी से आँखें धोएँ", "कॉन्टैक्ट लेंस तुरंत हटा दें"] },
    baseSeverity: "low"
  },
  {
    id: "pediatrics",
    keywords: ["child", "baby", "kid", "pediatric", "infant", "bacha", "bachha", "shishu"],
    aliases: ["child fever", "baby cough", "pediatric checkup", "infant colic", "bacche ko bukhar", "bachhe ki bimari", "shishu rog"],
    specialty: { en: "Pediatrician", hi: "Pediatrician" },
    possibleIssues: { en: ["Pediatric infection", "Childhood viral illness", "Infant colic"], hi: ["बाल चिकित्सा संक्रमण", "बचपन की वायरल बीमारी", "शिशु का पेट दर्द"] },
    precautions: { en: ["Consult child specialist before giving medication", "Keep the child hydrated", "Monitor temperature regularly"], hi: ["दवा देने से पहले बाल रोग विशेषज्ञ से सलाह लें", "बच्चे को हाइड्रेटेड रखें", "नियमित रूप से तापमान की निगरानी करें"] },
    baseSeverity: "medium"
  },
  {
    id: "psychiatry",
    keywords: ["depression", "insomnia", "panic", "hallucination", "bipolar", "adhd", "neend", "udaas", "hallucinate", "psychosis", "suicidal"],
    aliases: ["severe depression", "panic attack", "sleep disorder", "hallucinations", "mood swings", "neend na aana", "bhaari udaasi", "panic hona"],
    specialty: { en: "Psychiatrist", hi: "Psychiatrist" },
    possibleIssues: { en: ["Depressive disorder", "Panic and anxiety disorder", "Insomnia", "Clinical mood disorder"], hi: ["अवसादग्रस्तता विकार", "पैनिक और चिंता विकार", "अनिद्रा", "नैदानिक मनोदशा विकार"] },
    precautions: { en: ["Practice slow, deep breathing", "Avoid caffeine, alcohol, and self-medication", "Ensure a safe environment", "Reach out to a trusted person or helpline"], hi: ["धीमी, गहरी सांस लेने का अभ्यास करें", "कैफीन, शराब और स्व-दवा से बचें", "सुरक्षित वातावरण सुनिश्चित करें", "किसी भरोसेमंद व्यक्ति या हेल्पलाइन से संपर्क करें"] },
    baseSeverity: "medium"
  },
  {
    id: "psychology",
    keywords: ["stress", "anxiety", "grief", "relationship", "tanaav", "chinta", "gussa", "anxious", "overthinking"],
    aliases: ["work stress", "mental stress", "relationship issues", "feeling anxious", "grief support", "chinta hona", "stress hona", "overthinking hona"],
    specialty: { en: "Psychologist", hi: "Psychologist" },
    possibleIssues: { en: ["Situational stress", "Mild anxiety", "Adjustment difficulties", "Relationship/emotional stress"], hi: ["परिस्थिति जन्य तनाव", "हल्की चिंता", "समायोजन कठिनाइयाँ", "संबंधों/भावनात्मक तनाव"] },
    precautions: { en: ["Practice mindfulness or meditation", "Express feelings in a journal", "Maintain a balanced daily routine", "Engage in light physical activity"], hi: ["माइंडफुलनेस या ध्यान का अभ्यास करें", "एक डायरी में भावनाएं लिखें", "संतुलित दैनिक दिनचर्या बनाए रखें", "हल्की शारीरिक गतिविधि करें"] },
    baseSeverity: "low"
  },
  {
    id: "gynecology",
    keywords: ["period", "menstrual", "pregnancy", "uterus", "vaginal", "ovary", "breast", "mahavari", "pregnant", "discharge"],
    aliases: ["irregular periods", "menstrual cramps", "pregnancy test", "vaginal discharge", "pelvic pain", "mahavari ki samasya", "safed pani", "period pain"],
    specialty: { en: "Gynecologist", hi: "Gynecologist" },
    possibleIssues: { en: ["Dysmenorrhea (Menstrual cramps)", "Vaginal infection", "Hormonal menstrual changes"], hi: ["कष्टार्तव (मासिक धर्म में ऐंठन)", "योनि संक्रमण", "हार्मोनल मासिक धर्म परिवर्तन"] },
    precautions: { en: ["Apply warm compress for cramps", "Maintain intimate hygiene", "Track cycle dates regularly", "Take pregnancy test if period is delayed"], hi: ["ऐंठन के लिए गर्म सिकाई करें", "व्यक्तिगत स्वच्छता बनाए रखें", "नियमित रूप से मासिक धर्म की तारीखें ट्रैक करें", "मासिक धर्म में देरी होने पर गर्भावस्था परीक्षण करें"] },
    baseSeverity: "medium"
  },
  {
    id: "ent_specialist",
    keywords: ["ear", "nose", "throat", "tonsil", "sinus", "tinnitus", "kaan", "naak", "gala"],
    aliases: ["ear pain", "throat pain", "runny nose", "tonsil swelling", "sinus pressure", "blocked nose", "gala kharab", "kaan me dard", "ringing in ear"],
    specialty: { en: "ENT Specialist", hi: "ENT Specialist" },
    possibleIssues: { en: ["Tonsillitis", "Sinusitis", "Otitis media (Ear infection)", "Pharyngitis"], hi: ["टॉन्सिलाइटिस", "साइनसाइटिस", "ओटिटिस मीडिया (कान का संक्रमण)", "ग्रसनीशोथ"] },
    precautions: { en: ["Gargle with warm salt water", "Perform steam inhalation", "Avoid cold beverages or ice", "Do not insert cotton buds or sharp items into ears"], hi: ["गुनगुने नमक के पानी से गरारे करें", "भाप लें", "ठंडे पेय या बर्फ से बचें", "कानों में कॉटन बड्स या नुकीली चीजें न डालें"] },
    baseSeverity: "low"
  },
  {
    id: "urology",
    keywords: ["urine", "bladder", "prostate", "kidney stone", "urinate", "peshab", "pathri", "uti"],
    aliases: ["painful urination", "burning urine", "blood in urine", "urinary infection", "peshab me jalan", "peshab me dard", "bladder pain"],
    specialty: { en: "Urologist", hi: "Urologist" },
    possibleIssues: { en: ["Urinary Tract Infection (UTI)", "Urolithiasis (Kidney stones)", "Prostatitis"], hi: ["मूत्र मार्ग में संक्रमण (UTI)", "गुर्दे की पथरी", "प्रोस्टेट की सूजन"] },
    precautions: { en: ["Drink 3-4 liters of water daily", "Avoid holding urine for long", "Avoid caffeine, alcohol, and spicy foods", "Maintain genital hygiene"], hi: ["रोजाना 3-4 लीटर पानी पिएं", "लंबे समय तक पेशाब न रोकें", "कैफीन, शराब और मसालेदार भोजन से बचें", "जननांग स्वच्छता बनाए रखें"] },
    baseSeverity: "medium"
  },
  {
    id: "nephrologist",
    keywords: ["creatinine", "kidney", "dialysis", "nephrology", "proteinuria", "frothy urine", "pairon", "sujan"],
    aliases: ["kidney disease", "high creatinine", "protein in urine", "swelling in legs", "pairon me sujan", "kidney failure", "kidney functioning"],
    specialty: { en: "Nephrologist", hi: "Nephrologist" },
    possibleIssues: { en: ["Chronic Kidney Disease (CKD) evaluation", "Nephrotic syndrome", "Reduced kidney function"], hi: ["क्रोनिक किडनी रोग मूल्यांकन", "नेफ्रोटिक सिंड्रोम", "गुर्दे की कार्यप्रणाली में कमी"] },
    precautions: { en: ["Limit daily sodium/salt intake", "Monitor daily fluid consumption", "Avoid painkiller medicines (NSAIDs like Ibuprofen)", "Control blood pressure"], hi: ["दैनिक सोडियम/नमक का सेवन सीमित करें", "दैनिक तरल पदार्थ की खपत की निगरानी करें", "दर्द निवारक दवाओं (NSAIDs जैसे इबुप्रोफेन) से बचें", "रक्तचाप नियंत्रित रखें"] },
    baseSeverity: "high"
  },
  {
    id: "oncologist",
    keywords: ["chemo", "cancer", "tumor", "lump", "oncology", "ganth", "biopsy"],
    aliases: ["persistent lump", "cancer screening", "unexplained weight loss", "ganth hona", "cancer checkup", "tumor mass"],
    specialty: { en: "Oncologist", hi: "Oncologist" },
    possibleIssues: { en: ["Neoplastic growth screening", "Tumor evaluation required", "Malignancy screening"], hi: ["नियोप्लास्टिक वृद्धि स्क्रीनिंग", "ट्यूमर मूल्यांकन की आवश्यकता", "घातकता स्क्रीनिंग"] },
    precautions: { en: ["Avoid self-treatment or unnecessary delay", "Keep all diagnostic scans and biopsy reports ready", "Avoid smoking, tobacco, and alcohol"], hi: ["स्वयं उपचार या अनावश्यक देरी से बचें", "सभी नैदानिक स्कैन और बायोप्सी रिपोर्ट तैयार रखें", "धूम्रपान, तंबाकू और शराब से बचें"] },
    baseSeverity: "high"
  },
  {
    id: "physiotherapist",
    keywords: ["physiotherapy", "rehab", "stiffness", "paralysis", "stroke", "posture", "exercise", "jakdan"],
    aliases: ["physical therapy", "muscle stiffness", "stroke rehab", "posture correction", "sports injury recovery", "muscle weakness", "sharir me jakdan"],
    specialty: { en: "Physiotherapist", hi: "Physiotherapist" },
    possibleIssues: { en: ["Musculoskeletal stiffness", "Postural dysfunction", "Physical rehabilitation need"], hi: ["मस्कुलोस्केलेटल अकड़न", "आसन संबंधी शिथिलता", "शारीरिक पुनर्वास की आवश्यकता"] },
    precautions: { en: ["Avoid sudden jerky movements", "Perform gentle prescribed stretches", "Maintain proper ergonomic posture", "Apply warm compress for stiff muscles"], hi: ["अचानक झटकेदार हरकतों से बचें", "हल्की निर्धारित स्ट्रेचिंग करें", "सही एर्गोनोमिक मुद्रा बनाए रखें", "कठोर मांसपेशियों के लिए गर्म सिकाई करें"] },
    baseSeverity: "low"
  },
  {
    id: "dietitian",
    keywords: ["diet", "nutrition", "calories", "obesity", "meal", "motapa", "vajan", "dietitian", "nutritionist"],
    aliases: ["weight loss diet", "diet plan", "nutritional advice", "weight gain diet", "meal chart", "weight management"],
    specialty: { en: "Dietitian", hi: "Dietitian" },
    possibleIssues: { en: ["Dietary management support", "Weight management guidance", "Nutritional counseling"], hi: ["आहार प्रबंधन सहायता", "वजन प्रबंधन मार्गदर्शन", "पोषण संबंधी परामर्श"] },
    precautions: { en: ["Maintain a daily food journal", "Stay well hydrated", "Avoid skipping meals (especially breakfast)", "Reduce processed sugar and fast food"], hi: ["दैनिक भोजन की डायरी रखें", "अच्छी तरह से हाइड्रेटेड रहें", "भोजन (विशेषकर नाश्ता) छोड़ना बंद करें", "प्रसंस्कृत चीनी और फास्ट फूड कम करें"] },
    baseSeverity: "low"
  },
  {
    id: "pulmonologist",
    keywords: ["cough", "asthma", "wheezing", "bronchitis", "copd", "lung", "dama", "balgam", "respiratory"],
    aliases: ["chronic cough", "breathing trouble", "asthma attack", "coughing up blood", "saans phulna", "chronic khansi", "lung infection", "difficulty breathing"],
    specialty: { en: "Pulmonologist", hi: "Pulmonologist" },
    possibleIssues: { en: ["Asthma exacerbation", "Bronchitis", "Chronic Obstructive Pulmonary Disease (COPD)", "Respiratory infection"], hi: ["अस्थमा का बढ़ना", "ब्रोंकाइटिस", "क्रॉनिक ऑब्स्ट्रक्टिव पल्मोनरी डिजीज (COPD)", "श्वसन संक्रमण"] },
    precautions: { en: ["Avoid exposure to dust, smoke, and pollution", "Keep rescue inhaler handy if prescribed", "Perform steam inhalation", "Avoid cold drinks"], hi: ["धूल, धुएं और प्रदूषण के संपर्क से बचें", "यदि निर्धारित हो तो बचाव इनहेलर पास रखें", "भाप लें", "ठंडे पेय पदार्थों से बचें"] },
    baseSeverity: "high"
  },
  {
    id: "endocrinologist",
    keywords: ["diabetes", "thyroid", "hormone", "sugar", "gland", "insulin", "endocrinology"],
    aliases: ["sugar level", "thyroid problem", "hormonal imbalance", "diabetes checkup", "sugar ki bimari", "thyroid checkup"],
    specialty: { en: "Endocrinologist", hi: "Endocrinologist" },
    possibleIssues: { en: ["Diabetes mellitus", "Thyroid dysfunction (Hypo/Hyper)", "Hormonal imbalance"], hi: ["मधुमेह (डायबिटीज)", "थायराइड रोग", "हार्मोनल असंतुलन"] },
    precautions: { en: ["Monitor blood sugar levels regularly", "Take prescribed thyroid/diabetes tests", "Limit high-glycemic sugar and refined carbohydrates", "Engage in daily exercise"], hi: ["नियमित रूप से रक्त शर्करा के स्तर की निगरानी करें", "निर्धारित थायराइड/मधुमेह परीक्षण कराएं", "उच्च-ग्लाइसेमिक चीनी और परिष्कृत कार्बोहाइड्रेट सीमित करें", "दैनिक व्यायाम करें"] },
    baseSeverity: "medium"
  },
  {
    id: "sexologist",
    keywords: ["libido", "erectile", "ejaculation", "sexual", "gupt", "rog"],
    aliases: ["erectile dysfunction", "sexual health", "low libido", "gupt rog samasya", "sexual dysfunction"],
    specialty: { en: "Sexologist", hi: "Sexologist" },
    possibleIssues: { en: ["Sexual health concern", "Erectile dysfunction", "Hormonal/psychological sexual issues"], hi: ["यौन स्वास्थ्य संबंधी चिंता", "स्तंभन दोष", "हॉर्मोनल/मनोवैज्ञानिक यौन समस्याएं"] },
    precautions: { en: ["Reduce daily stress and anxiety", "Avoid unverified online supplements", "Discuss concerns openly with your partner", "Adopt a healthy sleep cycle"], hi: ["तनाव और चिंता को कम करें", "अपुष्ट ऑनलाइन सप्लीमेंट्स से बचें", "अपने साथी के साथ खुलकर चर्चा करें", "स्वस्थ नींद चक्र अपनाएं"] },
    baseSeverity: "low"
  },
  {
    id: "general_medicine",
    keywords: ["cough", "cold", "fever", "throat", "headache", "bodyache", "tired", "weakness", "bukhar", "khansi", "gala", "thakan", "sardi", "badan"],
    aliases: ["viral fever", "common cold", "mild cough", "body pain", "weakness fatigue", "sore throat", "gala kharab", "sardi jukam", "badan dard", "general checkup"],
    specialty: { en: "General Physician", hi: "General Physician" },
    possibleIssues: { en: ["Viral fever", "Common cold", "Upper respiratory tract infection", "General weakness"], hi: ["वायरल बुखार", "सामान्य सर्दी", "ऊपरी श्वसन पथ का संक्रमण", "सामान्य कमजोरी"] },
    precautions: { en: ["Drink plenty of warm fluids", "Take adequate rest", "Monitor body temperature every 6 hours", "Gargle with warm salt water for throat relief"], hi: ["भरपूर गुनगुना तरल पदार्थ पिएं", "पर्याप्त आराम करें", "हर 6 घंटे में शरीर के तापमान की निगरानी करें", "गले की राहत के लिए गुनगुने नमक के पानी से गरारे करें"] },
    baseSeverity: "low"
  }
];

const normalizeWord = (word) => {
  if (!word) return "";
  let w = word.toLowerCase().trim();
  w = HINGLISH_MAP[w] || w;
  if (STEM_WHITELIST.includes(w)) return w;
  return w.replace(/ing$|s$|es$/i, '');
};

// ROBUST LOCAL RULES FALLBACK ENGINE
const analyzeSymptomsLocal = (symptoms, language = "en") => {
  const rawInput = symptoms.toLowerCase();
  const tokens = rawInput.split(/[\s,.;?]+/).map(normalizeWord).filter(t => t.length > 1);

  const isEmergency = EMERGENCY_KEYWORDS.some(ek => rawInput.includes(ek));
  let matches = [];

  SYMPTOM_RULES.forEach(rule => {
    let score = 0;
    let matchedCount = 0;

    const allTerms = [
      ...rule.keywords.map(k => ({ t: k, w: 5 })),
      ...rule.aliases.map(a => ({ t: a, w: 2 }))
    ];

    allTerms.forEach(term => {
      const termTokens = term.t.split(" ").map(normalizeWord).filter(t => t.length > 1);
      const isMatch = termTokens.every(tt => tokens.includes(tt));
      if (isMatch) {
        score += term.w;
        matchedCount++;
      }
    });

    if (matchedCount > 0) {
      if (isEmergency && rule.id === "cardiology" && rawInput.includes("chest")) score += 10;
      const confidence = Math.min((score / 10) * 100, 100);
      
      const isHindi = language && language.startsWith('hi');
      
      if (confidence >= MIN_CONFIDENCE || (isEmergency && rule.id === "cardiology")) {
        matches.push({
          ...rule,
          confidence: Math.round(confidence),
          displaySpecialty: rule.specialty.en, // Keep English key for DB/search query mapping consistency
          displayPrecautions: isHindi ? rule.precautions.hi : rule.precautions.en,
          displayIssues: isHindi ? rule.possibleIssues.hi : rule.possibleIssues.en
        });
      }
    }
  });

  matches.sort((a, b) => b.confidence - a.confidence);
  return formatFinalResponse(matches, isEmergency, language);
};

export const analyzeSymptoms = async (symptoms, userId = null, language = "en") => {
  try {
    if (symptoms.length > MAX_CHARS) throw new Error("Input too long");

    if (userId) {
      try {
        const recentCheck = await getRecentCheck(userId);
        if (recentCheck) {
          const diff = (new Date() - recentCheck.createdAt.toDate()) / (1000 * 60);
          if (diff < COOLDOWN_MINUTES) throw new Error(`Wait ${Math.ceil(COOLDOWN_MINUTES - diff)}m.`);
        }
      } catch (error) { console.warn("Cooldown skipped:", error); }
    }

    let result;
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("Gemini API Key missing, using local fallback");
    }

    try {
      // CALL GEMINI API WITH STRICT SPECIALTY CONSTRAINTS
      const isHindi = language && language.startsWith('hi');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Analyze these medical symptoms in ${isHindi ? 'Hindi' : 'English'}.
Symptoms description: "${symptoms}"

You must output ONLY a valid JSON object matching the schema below. Do not wrap it in markdown block, do not include any backticks or explanatory text. Just the raw JSON.

JSON Schema:
{
  "suggestion": "Brief doctor consultation advice statement in the target language (e.g. Primary Guidance: Dentist consultation recommended)",
  "primarySpecialist": "The single most appropriate doctor specialty in English. It MUST be chosen exactly from this list: [General Physician, Cardiologist, Dermatologist, Pediatrician, Orthopedic, Gynecologist, Ophthalmologist, Neurologist, ENT Specialist, Psychiatrist, Dentist, Urologist, Oncologist, Physiotherapist, Dietitian, Pulmonologist, Gastroenterologist, Endocrinologist, Nephrologist, Sexologist, Psychologist]",
  "secondarySpecialists": ["Up to 2 other alternative doctor specialties in English chosen exactly from the list above"],
  "precautions": ["List of 2-3 temporary steps or precautions in the target language"],
  "possibleIssues": ["List of 1-2 potential common causes or issues in the target language"],
  "confidence": number (an integer between 20 and 100 based on your confidence),
  "emergency": boolean (true ONLY if severe medical emergency signs like chest pain, heavy bleeding, unconsciousness, severe breathing problems),
  "reasoning": "A simple, friendly 1-sentence explanation in the target language of why this specialist is recommended based on the symptoms",
  "disclaimer": "Not a diagnosis. Seek professional medical advice."
}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API HTTP status: ${response.status}`);
      }

      const responseData = await response.json();
      const text = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) throw new Error("Empty text returned from Gemini API");

      result = JSON.parse(text);
      result.type = "AI Smart Guidance";
    } catch (apiError) {
      console.warn("Gemini API failed, using local rule-engine fallback:", apiError);
      result = analyzeSymptomsLocal(symptoms, language);
      result.type = "Local Fallback Guidance";
    }

    if (userId) {
      try { await saveCheckHistory(userId, symptoms, result); } catch (error) { console.warn("Save failed:", error); }
    }

    return result;

  } catch (error) {
    console.error("Engine Error:", error);
    throw error;
  }
};

const formatFinalResponse = (matches, isEmergency, language) => {
  const isHindi = language && language.startsWith('hi');
  
  if (matches.length === 0) {
    return {
      suggestion: isHindi ? "कृपया सामान्य चिकित्सक से सलाह लें।" : "Please consult a General Physician.",
      primarySpecialist: "General Physician",
      secondarySpecialists: [],
      precautions: isHindi ? ["आराम करें", "पर्याप्त पानी पिएं"] : ["Rest well", "Stay hydrated"],
      possibleIssues: [],
      confidence: 0,
      emergency: isEmergency,
      reasoning: isHindi 
        ? "आपके लक्षणों के लिए हमारे डेटाबेस में कोई सीधा नियम नहीं मिला, इसलिए सामान्य चिकित्सक से परामर्श करने की सलाह दी जाती है।" 
        : "No direct rule matched in our database, a consultation with a General Physician is recommended for initial assessment.",
      type: "Guidance",
      disclaimer: "Legal Disclaimer: Not a diagnosis."
    };
  }

  const primary = matches[0];
  const secondary = matches.slice(1, 3).map(m => m.displaySpecialty);

  return {
    suggestion: isHindi 
      ? `प्राथमिक सुझाव: ${primary.displaySpecialty} मूल्यांकन।`
      : `Primary Guidance: ${primary.displaySpecialty} evaluation recommended.`,
    primarySpecialist: primary.displaySpecialty,
    secondarySpecialists: secondary,
    precautions: primary.displayPrecautions,
    possibleIssues: [...new Set(matches.flatMap(m => m.displayIssues))],
    confidence: primary.confidence,
    emergency: isEmergency,
    reasoning: isHindi
      ? `आपके बताए गए लक्षणों के आधार पर ${primary.displaySpecialty} से परामर्श करने की सलाह दी जाती है।`
      : `Based on the keywords in your symptoms, a consultation with a ${primary.displaySpecialty} is recommended.`,
    type: "Smart Guidance",
    disclaimer: "Not a diagnosis. Seek professional advice."
  };
};

const getRecentCheck = async (userId) => {
  const q = query(collection(db, "symptomChecks"), where("userId", "==", userId), orderBy("createdAt", "desc"), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].data();
};

const saveCheckHistory = async (userId, symptoms, result) => {
  await addDoc(collection(db, "symptomChecks"), { userId, symptoms, result, createdAt: serverTimestamp() });
};
