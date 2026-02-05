import { useState, useEffect, useRef } from "react";

const TIFFANY = "#81D8D0";
const TIFFANY_LIGHT = "#B5E8E3";
const TIFFANY_DARK = "#5CB8B2";
const SEAMOSS = "#7DB87D";
const SEAMOSS_LIGHT = "#A8D4A8";
const SEAMOSS_DARK = "#5A9A5A";

const AILMENTS_DATA = [
  {
    category: "Skin Conditions",
    items: [
      { name: "Eczema", icon: "🧴", avoid: ["Fragrance/Parfum", "Sodium Lauryl Sulfate (SLS)", "Alcohol Denat", "Parabens", "Formaldehyde", "Lanolin", "Propylene Glycol", "Cocamidopropyl Betaine", "Essential Oils"] },
      { name: "Rosacea", icon: "🌹", avoid: ["Alcohol Denat", "Fragrance/Parfum", "Menthol", "Witch Hazel", "Eucalyptus Oil", "Peppermint", "Salicylic Acid", "Retinol", "Sodium Lauryl Sulfate (SLS)"] },
      { name: "Psoriasis", icon: "💧", avoid: ["Fragrance/Parfum", "Alcohol Denat", "Sulfates", "Parabens", "Formaldehyde", "Coal Tar (in some contexts)", "Salicylic Acid (high %)", "Essential Oils"] },
      { name: "Acne-Prone Skin", icon: "✨", avoid: ["Coconut Oil", "Isopropyl Myristate", "Algae Extract", "Lanolin", "Cocoa Butter", "Sodium Lauryl Sulfate (SLS)", "Mineral Oil", "Silicones (heavy)"] },
      { name: "Contact Dermatitis", icon: "⚡", avoid: ["Fragrance/Parfum", "Nickel", "Formaldehyde", "Preservatives (MI/MCI)", "Lanolin", "Balsam of Peru", "Parabens", "Cobalt Chloride"] },
      { name: "Sensitive Skin", icon: "🪶", avoid: ["Fragrance/Parfum", "Alcohol Denat", "Sulfates", "Parabens", "Essential Oils", "Retinol", "AHA/BHA (high %)", "Synthetic Dyes"] },
    ]
  },
  {
    category: "Digestive & Food",
    items: [
      { name: "Celiac Disease", icon: "🌾", avoid: ["Gluten", "Wheat", "Barley", "Rye", "Malt", "Brewer's Yeast", "Hydrolyzed Wheat Protein", "Modified Food Starch (wheat-based)"] },
      { name: "IBS", icon: "🫃", avoid: ["High-FODMAP Foods", "Artificial Sweeteners", "Lactose", "Fructose (excess)", "Sugar Alcohols (sorbitol, mannitol)", "Caffeine", "Inulin/Chicory Root", "Garlic & Onion Powder"] },
      { name: "Crohn's Disease", icon: "🩺", avoid: ["High-Fiber Insoluble Foods", "Lactose", "Artificial Sweeteners", "Spicy Ingredients", "High-Fat Foods", "Alcohol", "Caffeine", "Raw Vegetables"] },
      { name: "Lactose Intolerance", icon: "🥛", avoid: ["Lactose", "Milk Solids", "Whey", "Casein", "Cream", "Butter (in large amounts)", "Milk Powder", "Cheese (aged may be OK)"] },
      { name: "GERD / Acid Reflux", icon: "🔥", avoid: ["Citric Acid (high amounts)", "Caffeine", "Chocolate", "Peppermint", "Tomato-Based Ingredients", "Spicy Ingredients", "Carbonation", "High-Fat Foods"] },
      { name: "Food Allergies (Nut)", icon: "🥜", avoid: ["Tree Nuts", "Peanuts", "Peanut Oil", "Almond Extract", "Nutella-type Spreads", "Marzipan", "Praline", "Mixed Nuts"] },
      { name: "Food Allergies (Shellfish)", icon: "🦐", avoid: ["Shrimp", "Crab", "Lobster", "Glucosamine (shellfish-derived)", "Chitosan", "Carrageenan (sometimes cross-reactive)", "Fish Sauce"] },
      { name: "Food Allergies (Soy)", icon: "🫘", avoid: ["Soy Lecithin", "Soy Protein", "Soybean Oil", "Tofu", "Edamame", "Miso", "Tempeh", "Textured Vegetable Protein"] },
      { name: "Food Allergies (Egg)", icon: "🥚", avoid: ["Egg Whites", "Egg Yolks", "Albumin", "Lysozyme", "Mayonnaise", "Meringue", "Lecithin (egg-derived)"] },
    ]
  },
  {
    category: "Neurological & Chronic",
    items: [
      { name: "Parkinson's Disease", icon: "🧠", avoid: ["Artificial Sweeteners (Aspartame)", "High Iron Supplements", "Pesticide Residues", "BPA", "Lead", "Mercury", "Aluminum (in some products)"] },
      { name: "Migraines", icon: "🤕", avoid: ["Tyramine", "MSG", "Nitrates/Nitrites", "Artificial Sweeteners (Aspartame)", "Sulfites", "Caffeine (excess)", "Alcohol", "Aged Cheese"] },
      { name: "Multiple Sclerosis", icon: "🔬", avoid: ["Saturated Fats (excess)", "Processed Sugars", "Gluten (some patients)", "Artificial Additives", "Excess Sodium", "Dairy (some patients)"] },
      { name: "Epilepsy", icon: "⚕️", avoid: ["Artificial Sweeteners (Aspartame)", "MSG", "Excess Caffeine", "Alcohol", "Grapefruit (drug interactions)"] },
      { name: "Dementia / Alzheimer's", icon: "🧩", avoid: ["Aluminum (in products)", "Excess Sodium", "Trans Fats", "Nitrates/Nitrites", "Artificial Sweeteners (Aspartame)", "High-Mercury Fish", "Processed Meats", "Excess Alcohol"] },
      { name: "Fibromyalgia", icon: "💫", avoid: ["MSG", "Artificial Sweeteners (Aspartame)", "Gluten (some patients)", "Caffeine (excess)", "Processed Foods", "Nightshade Vegetables", "Sugar (excess)", "Food Dyes"] },
      { name: "ADHD", icon: "⚡", avoid: ["Artificial Food Dyes (Red 40, Yellow 5, Yellow 6)", "Artificial Sweeteners", "MSG", "High-Fructose Corn Syrup", "Sodium Benzoate", "Excess Sugar", "Salicylates (some patients)"] },
      { name: "Autism (Sensory Sensitivities)", icon: "🌈", avoid: ["Artificial Food Dyes", "Artificial Flavors", "MSG", "Casein", "Gluten (some individuals)", "Artificial Preservatives", "High-Fructose Corn Syrup", "Soy (some individuals)"] },
      { name: "Chronic Fatigue Syndrome", icon: "🔋", avoid: ["Caffeine (excess)", "Refined Sugars", "Alcohol", "Artificial Sweeteners", "Processed Foods", "Gluten (some patients)", "Dairy (some patients)"] },
      { name: "Neuropathy", icon: "🫳", avoid: ["Alcohol", "Excess Sugar", "Gluten (some patients)", "Artificial Sweeteners", "Heavy Metals (Mercury, Lead)", "MSG"] },
    ]
  },
  {
    category: "Autoimmune & Inflammatory",
    items: [
      { name: "Lupus", icon: "🦋", avoid: ["Alfalfa Sprouts", "Garlic (large amounts)", "Echinacea", "Sulfites", "High Sodium", "Processed Foods", "Alcohol"] },
      { name: "Rheumatoid Arthritis", icon: "🦴", avoid: ["Refined Sugars", "Omega-6 (excess)", "Fried Foods", "Gluten (some patients)", "Alcohol", "Processed Meats", "AGEs (Advanced Glycation End-products)"] },
      { name: "Hashimoto's", icon: "🦋", avoid: ["Excess Iodine", "Gluten (some patients)", "Soy (excess)", "Goitrogens (raw cruciferous, excess)", "Highly Processed Foods", "Artificial Sweeteners"] },
      { name: "Type 1 Diabetes", icon: "💉", avoid: ["Added Sugars", "High-Glycemic Ingredients", "Trans Fats", "Excess Sodium", "Artificial Sweeteners (some)"] },
      { name: "Type 2 Diabetes", icon: "📊", avoid: ["Added Sugars", "High-Fructose Corn Syrup", "Refined Carbohydrates", "Trans Fats", "Excess Sodium", "Artificial Sweeteners (some)"] },
    ]
  },
  {
    category: "Respiratory & Allergies",
    items: [
      { name: "Asthma", icon: "🫁", avoid: ["Sulfites", "Sodium Bisulfite", "Tartrazine (Yellow #5)", "Aspirin-related compounds", "MSG", "Strong Fragrances"] },
      { name: "Seasonal Allergies", icon: "🤧", avoid: ["Pollen-Cross-Reactive Foods", "Histamine-Rich Foods", "Sulfites", "Artificial Colors", "Preservatives (Benzoates)"] },
      { name: "Mast Cell Disorder (MCAS)", icon: "🔴", avoid: ["Histamine-Rich Foods", "Alcohol", "Fermented Foods", "Aged Cheeses", "Artificial Preservatives", "Sulfites", "Artificial Colors", "Benzoates"] },
    ]
  },
];

const PERSONAL_PREFERENCES = [
  { category: "Artificial Additives", items: ["Artificial Sweeteners", "Artificial Colors/Dyes", "Artificial Flavors", "Artificial Fragrances/Parfum", "MSG", "High-Fructose Corn Syrup", "Artificial Preservatives", "Sodium Benzoate", "Potassium Sorbate", "BHT / BHA"] },
  { category: "Chemicals & Compounds", items: ["Parabens", "Phthalates", "Sulfates (SLS/SLES)", "Formaldehyde", "Triclosan", "BPA / BPS", "Aluminum Compounds", "Petroleum / Mineral Oil", "Silicones", "PEGs (Polyethylene Glycols)", "Oxybenzone", "Talc", "Propylene Glycol", "Phenoxyethanol"] },
  { category: "Lifestyle & Diet", items: ["Non-Organic", "GMO Ingredients", "Animal Products (Vegan)", "Animal Testing (Not Cruelty-Free)", "Dairy", "Gluten", "Soy", "Palm Oil", "Alcohol (in skin products)", "Alcohol (in food/beverages)", "Caffeine", "Refined Sugar", "Trans Fats", "Seed Oils (Canola, Soybean, Sunflower, Safflower)", "Food Dyes (Red 40, Yellow 5, Yellow 6, Blue 1)", "Gums & Thickeners (Xanthan, Guar, Carrageenan)", "Citric Acid (manufactured)", "Nitrates / Nitrites", "Sodium Nitrate", "Maltodextrin", "Natural Flavors (undisclosed)", "Carrageenan", "Corn Syrup / Corn Starch", "Canola Oil", "Vegetable Oil (unspecified)", "Soy Lecithin", "Cellulose / Powdered Cellulose", "Titanium Dioxide"] },
  { category: "Environmental & Ethical", items: ["Non-Recyclable Packaging", "Microplastics", "Non-Biodegradable Ingredients", "Single-Use Plastics", "Bleached Fabrics / Chlorine-Bleached", "Formaldehyde-Treated Textiles", "PFAS / Forever Chemicals", "Synthetic Microfibers", "Non-Fair-Trade", "Tested on Animals", "Unsustainable Palm Oil", "Excess Plastic Packaging", "Non-Compostable Materials"] },
];

const DEMO_PRODUCTS = {
  scanned: {
    name: "SunShield UV Face Sunscreen SPF 50",
    brand: "GlowDerm",
    price: "$24.99",
    image: "☀️",
    flagged: ["Alcohol Denat", "Fragrance/Parfum", "Oxybenzone"],
  },
  alternatives: [
    { name: "EltaMD UV Clear SPF 46", brand: "EltaMD", price: "$39.00", image: "🧴", rating: 4.8, link: "#", badge: "Dermatologist Pick" },
    { name: "La Roche-Posay Anthelios Mineral SPF 50", brand: "La Roche-Posay", price: "$33.50", image: "🌿", rating: 4.7, link: "#", badge: "Fragrance-Free" },
    { name: "Supergoop Unseen SPF 40", brand: "Supergoop!", price: "$38.00", image: "✨", rating: 4.6, link: "#", badge: "Clean Beauty" },
  ]
};

const EnajLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <defs>
      <linearGradient id={`eg${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={TIFFANY} />
        <stop offset="30%" stopColor={SEAMOSS_LIGHT} />
        <stop offset="50%" stopColor={TIFFANY} />
        <stop offset="70%" stopColor={SEAMOSS} />
        <stop offset="100%" stopColor={TIFFANY_DARK} />
      </linearGradient>
      <filter id={`gl${size}`}>
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    <circle cx="50" cy="50" r="46" fill={`url(#eg${size})`} filter={`url(#gl${size})`} />
    <text x="50" y="62" textAnchor="middle" fill="white" fontSize="36" fontWeight="800" fontFamily="'Georgia', serif" letterSpacing="-1">e</text>
  </svg>
);

const screens = { WELCOME: "welcome", AILMENTS: "ailments", PREFERENCES: "preferences", DOWNLOAD_EXT: "downloadExt", HOME: "home", MONITORING: "monitoring", EXTENSION_DEMO: "extensionDemo", SCAN_RESULT: "scanResult" };

export default function EnajApp() {
  const [screen, setScreen] = useState(screens.WELCOME);
  const [selectedAilments, setSelectedAilments] = useState([]);
  const [customAilment, setCustomAilment] = useState("");
  const [selectedPrefs, setSelectedPrefs] = useState([]);
  const [userName, setUserName] = useState("");
  const [animateIn, setAnimateIn] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [removedIngredients, setRemovedIngredients] = useState({});

  const navigateTo = (s) => { setAnimateIn(false); setTimeout(() => { setScreen(s); setAnimateIn(true); }, 200); };
  const toggleAilment = (name) => setSelectedAilments(prev => prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]);
  const togglePref = (name) => setSelectedPrefs(prev => prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]);
  const toggleCategory = (cat) => setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));

  const removeIngredientFromAilment = (ailment, ingredient) => {
    setRemovedIngredients(prev => ({ ...prev, [ailment]: [...(prev[ailment] || []), ingredient] }));
  };
  const restoreIngredientToAilment = (ailment, ingredient) => {
    setRemovedIngredients(prev => ({ ...prev, [ailment]: (prev[ailment] || []).filter(i => i !== ingredient) }));
  };
  const getActiveIngredientsForAilment = (ailmentName) => {
    const item = AILMENTS_DATA.flatMap(c => c.items).find(i => i.name === ailmentName);
    if (!item) return [];
    return item.avoid.filter(ing => !(removedIngredients[ailmentName] || []).includes(ing));
  };
  const getRemovedIngredientsForAilment = (ailmentName) => removedIngredients[ailmentName] || [];

  const getAllAvoidIngredients = () => {
    const fromAilments = selectedAilments.flatMap(a => getActiveIngredientsForAilment(a));
    return [...new Set([...fromAilments, ...selectedPrefs])];
  };

  const getIngredientReasons = (flaggedIngredient) => {
    const reasons = { ailments: [], preferences: [] };
    const fL = flaggedIngredient.toLowerCase();
    selectedAilments.forEach(ailmentName => {
      const active = getActiveIngredientsForAilment(ailmentName);
      if (active.some(ing => ing.toLowerCase().includes(fL) || fL.includes(ing.toLowerCase()))) {
        const item = AILMENTS_DATA.flatMap(c => c.items).find(i => i.name === ailmentName);
        reasons.ailments.push({ name: ailmentName, icon: item?.icon || "🩺" });
      }
    });
    const matchedPref = selectedPrefs.find(p => p.toLowerCase().includes(fL) || fL.includes(p.toLowerCase()));
    if (matchedPref) reasons.preferences.push(matchedPref);
    return reasons;
  };

  const handleScan = () => { setScanning(true); setTimeout(() => { setScanning(false); navigateTo(screens.SCAN_RESULT); }, 2200); };

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "linear-gradient(165deg, #f0faf9 0%, #f5f9f5 40%, #eaf7f6 100%)", fontFamily: "'Libre Franklin', 'Avenir', 'Segoe UI', sans-serif", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${TIFFANY}66; border-radius: 4px; }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .btn-primary { background: linear-gradient(135deg, ${TIFFANY}, ${SEAMOSS}); color: white; border: none; padding: 16px 32px; border-radius: 50px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; font-family: 'Libre Franklin', sans-serif; box-shadow: 0 4px 20px ${TIFFANY}44; width: 100%; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 28px ${TIFFANY}66; }
        .btn-secondary { background: white; color: ${TIFFANY_DARK}; border: 2px solid ${TIFFANY}; padding: 14px 28px; border-radius: 50px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; font-family: 'Libre Franklin', sans-serif; width: 100%; }
        .chip { display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; border-radius: 25px; border: 2px solid #e0e0e0; background: white; cursor: pointer; transition: all 0.25s ease; font-size: 14px; font-weight: 500; font-family: 'Libre Franklin', sans-serif; user-select: none; }
        .chip:hover { border-color: ${TIFFANY}88; }
        .chip.selected { border-color: ${TIFFANY}; background: linear-gradient(135deg, ${TIFFANY}18, ${SEAMOSS}12); color: ${TIFFANY_DARK}; box-shadow: 0 2px 12px ${TIFFANY}22; }
        .chip.selected::after { content: '✓'; font-size: 12px; font-weight: 700; color: ${SEAMOSS}; }
        .pref-chip { display: inline-flex; align-items: center; padding: 8px 14px; border-radius: 20px; border: 1.5px solid #e8e8e8; background: white; cursor: pointer; transition: all 0.25s ease; font-size: 13px; font-weight: 500; font-family: 'Libre Franklin', sans-serif; user-select: none; }
        .pref-chip.selected { border-color: ${SEAMOSS}; background: linear-gradient(135deg, ${SEAMOSS}15, ${TIFFANY}10); color: ${SEAMOSS_DARK}; }
        .category-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: white; border-radius: 16px; cursor: pointer; transition: all 0.2s ease; border: 1.5px solid #f0f0f0; margin-bottom: 8px; }
        .category-header:hover { border-color: ${TIFFANY}44; box-shadow: 0 2px 12px ${TIFFANY}11; }
        .scan-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(4px); }
        .product-card { background: white; border-radius: 16px; padding: 14px; display: flex; gap: 12px; align-items: center; border: 1.5px solid #f0f0f0; transition: all 0.25s ease; cursor: pointer; text-decoration: none; color: inherit; }
        .product-card:hover { border-color: ${TIFFANY}66; box-shadow: 0 4px 20px ${TIFFANY}18; transform: translateY(-2px); }
        .ing-tag { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 10px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; border: 1.5px solid; }
        .ing-tag:hover { transform: scale(1.03); }
      `}</style>

      <div style={{ maxWidth: 420, margin: "0 auto", minHeight: "100vh", position: "relative", opacity: animateIn ? 1 : 0, transform: animateIn ? "translateY(0)" : "translateY(12px)", transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }}>
        {screen === screens.WELCOME && <WelcomeScreen userName={userName} setUserName={setUserName} onNext={() => navigateTo(screens.AILMENTS)} />}
        {screen === screens.AILMENTS && <AilmentsScreen selected={selectedAilments} onToggle={toggleAilment} customAilment={customAilment} setCustomAilment={setCustomAilment} expandedCategories={expandedCategories} toggleCategory={toggleCategory} onNext={() => navigateTo(screens.PREFERENCES)} onBack={() => navigateTo(screens.WELCOME)} />}
        {screen === screens.PREFERENCES && <PreferencesScreen selected={selectedPrefs} onToggle={togglePref} onNext={() => navigateTo(screens.DOWNLOAD_EXT)} onBack={() => navigateTo(screens.AILMENTS)} />}
        {screen === screens.DOWNLOAD_EXT && <DownloadExtScreen onNext={() => navigateTo(screens.HOME)} onBack={() => navigateTo(screens.PREFERENCES)} />}
        {screen === screens.HOME && <HomeScreen userName={userName} ailments={selectedAilments} avoidList={getAllAvoidIngredients()} onOpenExtDemo={() => navigateTo(screens.EXTENSION_DEMO)} onEditAilments={() => navigateTo(screens.AILMENTS)} onEditPrefs={() => navigateTo(screens.PREFERENCES)} onOpenMonitoring={() => navigateTo(screens.MONITORING)} />}
        {screen === screens.MONITORING && <MonitoringScreen ailments={selectedAilments} getActive={getActiveIngredientsForAilment} getRemoved={getRemovedIngredientsForAilment} onRemove={removeIngredientFromAilment} onRestore={restoreIngredientToAilment} prefs={selectedPrefs} onTogglePref={togglePref} onBack={() => navigateTo(screens.HOME)} />}
        {screen === screens.EXTENSION_DEMO && <ExtensionDemoScreen scanning={scanning} onScan={handleScan} onBack={() => navigateTo(screens.HOME)} />}
        {screen === screens.SCAN_RESULT && <ScanResultScreen product={DEMO_PRODUCTS.scanned} alternatives={DEMO_PRODUCTS.alternatives} userAvoid={getAllAvoidIngredients()} getReasons={getIngredientReasons} onBack={() => navigateTo(screens.EXTENSION_DEMO)} onHome={() => navigateTo(screens.HOME)} />}
      </div>
    </div>
  );
}

function WelcomeScreen({ userName, setUserName, onNext }) {
  return (
    <div style={{ padding: "60px 28px 40px", display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", justifyContent: "center" }}>
      <div style={{ animation: "float 3s ease-in-out infinite" }}><EnajLogo size={100} /></div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 700, background: `linear-gradient(135deg, ${TIFFANY_DARK}, ${SEAMOSS})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginTop: 20 }}>enaj</h1>
      <p style={{ color: "#7a8a8e", fontSize: 16, marginTop: 8, letterSpacing: "2px", textTransform: "uppercase" }}>Putting the power of shopping back in your hands.</p>
      <div style={{ marginTop: 48, width: "100%", maxWidth: 340 }}>
        <p style={{ color: "#556", fontSize: 14, fontWeight: 500, marginBottom: 10 }}>What should we call you?</p>
        <input type="text" value={userName} onChange={e => setUserName(e.target.value)} placeholder="Your first name" style={{ width: "100%", padding: "16px 20px", borderRadius: 16, border: "2px solid #e4e4e4", fontSize: 16, fontFamily: "'Libre Franklin', sans-serif", outline: "none", transition: "border-color 0.3s", background: "white" }} onFocus={e => e.target.style.borderColor = TIFFANY} onBlur={e => e.target.style.borderColor = "#e4e4e4"} />
      </div>
      <div style={{ marginTop: 36, width: "100%", maxWidth: 340 }}><button className="btn-primary" onClick={onNext}>Get Started →</button></div>
      <p style={{ marginTop: 24, color: "#aab", fontSize: 12, textAlign: "center", lineHeight: 1.6 }}>By continuing, you agree to our Terms of Service.<br />Your health data stays private and secure.</p>
    </div>
  );
}

function AilmentsScreen({ selected, onToggle, customAilment, setCustomAilment, expandedCategories, toggleCategory, onNext, onBack }) {
  return (
    <div style={{ padding: "20px 20px 120px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: 4, color: "#667" }}>←</button>
        <EnajLogo size={28} />
      </div>
      <div style={{ marginBottom: 24, paddingLeft: 4 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: "#2a3a3e", fontWeight: 600 }}>Your Health Profile</h2>
        <p style={{ color: "#7a8a8e", fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>Select any conditions you have. Enaj will automatically flag ingredients known to aggravate them.</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {AILMENTS_DATA.map(cat => (
          <div key={cat.category}>
            <div className="category-header" onClick={() => toggleCategory(cat.category)}>
              <span style={{ fontWeight: 600, fontSize: 14, color: "#3a4a4e" }}>{cat.category}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {cat.items.filter(i => selected.includes(i.name)).length > 0 && <span style={{ background: `linear-gradient(135deg, ${TIFFANY}, ${SEAMOSS})`, color: "white", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{cat.items.filter(i => selected.includes(i.name)).length}</span>}
                <span style={{ fontSize: 14, color: "#aab", transition: "transform 0.2s", transform: expandedCategories[cat.category] ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
              </div>
            </div>
            {expandedCategories[cat.category] && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 4px 16px", animation: "fadeUp 0.25s ease" }}>
                {cat.items.map(item => (
                  <span key={item.name} className={`chip ${selected.includes(item.name) ? "selected" : ""}`} onClick={() => onToggle(item.name)}>
                    <span>{item.icon}</span><span>{item.name}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20, padding: "0 4px" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#556", marginBottom: 8 }}>Have something else? Tell us:</p>
        <textarea value={customAilment} onChange={e => setCustomAilment(e.target.value)} placeholder="e.g., Histamine intolerance, Oral Allergy Syndrome..." rows={3} style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: "2px solid #e8e8e8", fontSize: 14, fontFamily: "'Libre Franklin', sans-serif", outline: "none", resize: "vertical", transition: "border-color 0.3s" }} onFocus={e => e.target.style.borderColor = TIFFANY} onBlur={e => e.target.style.borderColor = "#e8e8e8"} />
      </div>
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 28px 28px", background: "linear-gradient(transparent, #f0faf9ee 30%)", maxWidth: 420, margin: "0 auto" }}>
        <button className="btn-primary" onClick={onNext}>Continue — Set Preferences →</button>
        {selected.length > 0 && <p style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: SEAMOSS_DARK, fontWeight: 500 }}>{selected.length} condition{selected.length !== 1 ? "s" : ""} selected</p>}
      </div>
    </div>
  );
}

function PreferencesScreen({ selected, onToggle, onNext, onBack }) {
  return (
    <div style={{ padding: "20px 20px 120px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: 4, color: "#667" }}>←</button>
        <EnajLogo size={28} />
      </div>
      <div style={{ marginBottom: 24, paddingLeft: 4 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: "#2a3a3e", fontWeight: 600 }}>Your Preferences</h2>
        <p style={{ color: "#7a8a8e", fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>Beyond your health conditions, select anything else you want to avoid in your products.</p>
      </div>
      {PERSONAL_PREFERENCES.map(cat => (
        <div key={cat.category} style={{ marginBottom: 22 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: SEAMOSS_DARK, marginBottom: 10, textTransform: "uppercase", letterSpacing: "1px" }}>{cat.category}</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {cat.items.map(item => (
              <span key={item} className={`pref-chip ${selected.includes(item) ? "selected" : ""}`} onClick={() => onToggle(item)}>
                {selected.includes(item) && <span style={{ marginRight: 4, fontSize: 11 }}>✓</span>}{item}
              </span>
            ))}
          </div>
        </div>
      ))}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 28px 28px", background: "linear-gradient(transparent, #f0faf9ee 30%)", maxWidth: 420, margin: "0 auto" }}>
        <button className="btn-primary" onClick={onNext}>Save & Continue →</button>
        {selected.length > 0 && <p style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: SEAMOSS_DARK, fontWeight: 500 }}>{selected.length} preference{selected.length !== 1 ? "s" : ""} selected</p>}
      </div>
    </div>
  );
}

function DownloadExtScreen({ onNext }) {
  const [downloaded, setDownloaded] = useState(false);
  return (
    <div style={{ padding: "40px 28px", display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", justifyContent: "center" }}>
      <div style={{ width: 120, height: 120, borderRadius: 28, background: "linear-gradient(135deg, #fff, #f8fffe)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 40px ${TIFFANY}33`, border: `2px solid ${TIFFANY}33`, animation: "float 3s ease-in-out infinite" }}>
        <div style={{ position: "relative" }}><EnajLogo size={64} /><div style={{ position: "absolute", bottom: -4, right: -8, background: "white", borderRadius: 8, padding: "2px 6px", fontSize: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>🧩</div></div>
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: "#2a3a3e", fontWeight: 600, marginTop: 32, textAlign: "center" }}>Get the Browser Extension</h2>
      <p style={{ color: "#7a8a8e", fontSize: 14, marginTop: 10, textAlign: "center", lineHeight: 1.6, maxWidth: 300 }}>The Enaj extension lives in the corner of your screen. Press it anytime while shopping online.</p>
      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 300 }}>
        {[{ icon: "🔍", text: "Scans product ingredients instantly" }, { icon: "🚫", text: "Flags ingredients you want to avoid" }, { icon: "💡", text: "Suggests safe alternatives with links" }].map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "white", borderRadius: 14, border: "1px solid #f0f0f0", animation: `fadeUp 0.4s ease ${i * 0.1}s both` }}>
            <span style={{ fontSize: 22 }}>{f.icon}</span><span style={{ fontSize: 14, color: "#445", fontWeight: 500 }}>{f.text}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 36, width: "100%", maxWidth: 300 }}>
        {!downloaded ? (
          <button className="btn-primary" onClick={() => setDownloaded(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span>⬇️</span> Download Extension</button>
        ) : (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ background: `linear-gradient(135deg, ${TIFFANY}15, ${SEAMOSS}10)`, border: `2px solid ${SEAMOSS}44`, borderRadius: 16, padding: 16, textAlign: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 28 }}>✅</span><p style={{ color: SEAMOSS_DARK, fontWeight: 600, fontSize: 15, marginTop: 6 }}>Extension Installed!</p>
            </div>
            <button className="btn-primary" onClick={onNext}>Go to My Dashboard →</button>
          </div>
        )}
      </div>
      <button onClick={onNext} style={{ background: "none", border: "none", color: "#99a", fontSize: 13, marginTop: 16, cursor: "pointer", fontFamily: "'Libre Franklin'", textDecoration: "underline" }}>Skip for now</button>
    </div>
  );
}

function HomeScreen({ userName, ailments, avoidList, onOpenExtDemo, onEditAilments, onEditPrefs, onOpenMonitoring }) {
  return (
    <div style={{ padding: "20px 20px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <p style={{ color: "#99a", fontSize: 13, fontWeight: 500 }}>Welcome back,</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#2a3a3e", fontWeight: 600 }}>{userName || "Friend"} 👋</h1>
        </div>
        <EnajLogo size={40} />
      </div>

      <div style={{ background: `linear-gradient(135deg, ${TIFFANY}, ${SEAMOSS})`, borderRadius: 20, padding: 24, color: "white", marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, position: "relative" }}>🛡️ Your Shield is Active</h3>
        <p style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5, position: "relative" }}>Enaj is monitoring <strong>{avoidList.length} ingredients</strong> across all your shopping sessions.</p>
        <button onClick={onOpenExtDemo} style={{ marginTop: 16, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "12px 24px", borderRadius: 30, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Libre Franklin'", position: "relative" }}>Try Extension Demo →</button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#3a4a4e" }}>My Conditions</h3>
          <button onClick={onEditAilments} style={{ background: "none", border: "none", color: TIFFANY_DARK, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Libre Franklin'" }}>Edit</button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ailments.length > 0 ? ailments.map(a => {
            const item = AILMENTS_DATA.flatMap(c => c.items).find(i => i.name === a);
            return <span key={a} style={{ padding: "8px 14px", borderRadius: 20, background: `linear-gradient(135deg, ${TIFFANY}12, ${SEAMOSS}08)`, border: `1.5px solid ${TIFFANY}33`, fontSize: 13, fontWeight: 500, color: TIFFANY_DARK }}>{item?.icon} {a}</span>;
          }) : <p style={{ color: "#aab", fontSize: 13, fontStyle: "italic" }}>No conditions added yet</p>}
        </div>
      </div>

      {/* Monitoring CTA */}
      <div onClick={onOpenMonitoring} style={{ background: "white", borderRadius: 16, padding: 18, border: `2px solid ${TIFFANY}33`, marginBottom: 20, cursor: "pointer", transition: "all 0.2s ease" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🔬</span>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#2a3a3e" }}>What Enaj Monitors</p>
              <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>View & edit ingredients per condition</p>
            </div>
          </div>
          <span style={{ color: TIFFANY_DARK, fontSize: 20, fontWeight: 600 }}>›</span>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 16, padding: 18, border: "1px solid #f0f0f0" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#3a4a4e", marginBottom: 12 }}>Quick Actions</h3>
        {[
          { icon: "🧩", label: "Browser Extension", sub: "Active & monitoring", action: onOpenExtDemo },
          { icon: "🔬", label: "My Monitoring List", sub: `${avoidList.length} ingredients tracked`, action: onOpenMonitoring },
          { icon: "📋", label: "Scan History", sub: "3 products scanned" },
          { icon: "⭐", label: "Saved Alternatives", sub: "7 products saved" },
          { icon: "⚙️", label: "Settings", sub: "Notifications, account" },
        ].map((item, i) => (
          <div key={i} onClick={item.action} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < 4 ? "1px solid #f5f5f5" : "none", cursor: item.action ? "pointer" : "default" }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <div style={{ flex: 1 }}><p style={{ fontSize: 14, fontWeight: 600, color: "#3a4a4e" }}>{item.label}</p><p style={{ fontSize: 12, color: "#99a" }}>{item.sub}</p></div>
            <span style={{ color: "#ccd", fontSize: 16 }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== NEW: MONITORING SCREEN ===== */
function MonitoringScreen({ ailments, getActive, getRemoved, onRemove, onRestore, prefs, onTogglePref, onBack }) {
  const [expandedAilment, setExpandedAilment] = useState(null);
  const [showRemoved, setShowRemoved] = useState({});

  return (
    <div style={{ padding: "20px 20px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: 4, color: "#667" }}>←</button>
        <EnajLogo size={28} />
      </div>
      <div style={{ marginBottom: 24, paddingLeft: 4 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: "#2a3a3e", fontWeight: 600 }}>What Enaj Monitors</h2>
        <p style={{ color: "#7a8a8e", fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>See exactly which ingredients Enaj watches for each of your conditions. Tap any ingredient to remove it from monitoring, or restore ones you've dismissed.</p>
      </div>

      {ailments.length > 0 ? ailments.map(ailmentName => {
        const item = AILMENTS_DATA.flatMap(c => c.items).find(i => i.name === ailmentName);
        if (!item) return null;
        const active = getActive(ailmentName);
        const removed = getRemoved(ailmentName);
        const isExpanded = expandedAilment === ailmentName;
        return (
          <div key={ailmentName} style={{ marginBottom: 14, animation: "fadeUp 0.3s ease" }}>
            <div onClick={() => setExpandedAilment(isExpanded ? null : ailmentName)}
              style={{ background: "white", borderRadius: 16, padding: "14px 18px", cursor: "pointer", border: isExpanded ? `2px solid ${TIFFANY}55` : "2px solid #f0f0f0", transition: "all 0.2s ease", boxShadow: isExpanded ? `0 4px 20px ${TIFFANY}15` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#2a3a3e" }}>{ailmentName}</p>
                    <p style={{ fontSize: 12, color: "#888", marginTop: 1 }}>{active.length} monitored{removed.length > 0 && <span style={{ color: "#bbb" }}> · {removed.length} dismissed</span>}</p>
                  </div>
                </div>
                <span style={{ fontSize: 14, color: "#aab", transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
              </div>
            </div>
            {isExpanded && (
              <div style={{ padding: "12px 8px 4px", animation: "fadeUp 0.25s ease" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: SEAMOSS_DARK, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Active — tap to dismiss</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {active.map(ing => (
                    <span key={ing} className="ing-tag" onClick={() => onRemove(ailmentName, ing)} style={{ background: `${TIFFANY}10`, borderColor: `${TIFFANY}44`, color: TIFFANY_DARK }}>
                      🚫 {ing} <span style={{ fontSize: 10, opacity: 0.5, marginLeft: 2 }}>✕</span>
                    </span>
                  ))}
                  {active.length === 0 && <p style={{ fontSize: 12, color: "#bbb", fontStyle: "italic" }}>All ingredients dismissed for this condition</p>}
                </div>
                {removed.length > 0 && (
                  <>
                    <button onClick={() => setShowRemoved(p => ({ ...p, [ailmentName]: !p[ailmentName] }))} style={{ background: "none", border: "none", fontSize: 12, color: "#999", cursor: "pointer", fontFamily: "'Libre Franklin'", fontWeight: 500, marginBottom: 6 }}>
                      {showRemoved[ailmentName] ? "Hide" : "Show"} dismissed ({removed.length}) ›
                    </button>
                    {showRemoved[ailmentName] && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, animation: "fadeUp 0.2s ease" }}>
                        {removed.map(ing => (
                          <span key={ing} className="ing-tag" onClick={() => onRestore(ailmentName, ing)} style={{ background: "#f8f8f8", borderColor: "#ddd", color: "#999", textDecoration: "line-through" }}>
                            {ing} <span style={{ fontSize: 10, color: SEAMOSS, textDecoration: "none", marginLeft: 2 }}>↩</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      }) : (
        <div style={{ background: "white", borderRadius: 16, padding: 24, textAlign: "center", border: "1px solid #f0f0f0", marginBottom: 20 }}>
          <p style={{ color: "#aab", fontSize: 14 }}>No conditions added yet.</p>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#2a3a3e", fontWeight: 600, marginBottom: 6 }}>Personal Preferences</h3>
        <p style={{ fontSize: 13, color: "#7a8a8e", marginBottom: 14, lineHeight: 1.5 }}>These are flagged regardless of your conditions. Tap to remove.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {prefs.length > 0 ? prefs.map(p => (
            <span key={p} className="ing-tag" onClick={() => onTogglePref(p)} style={{ background: `${SEAMOSS}10`, borderColor: `${SEAMOSS}44`, color: SEAMOSS_DARK }}>
              🚫 {p} <span style={{ fontSize: 10, opacity: 0.5, marginLeft: 2 }}>✕</span>
            </span>
          )) : <p style={{ fontSize: 12, color: "#bbb", fontStyle: "italic" }}>No personal preferences set</p>}
        </div>
      </div>
    </div>
  );
}

function ExtensionDemoScreen({ scanning, onScan, onBack }) {
  return (
    <div style={{ padding: "20px", minHeight: "100vh", position: "relative", background: "#fafafa" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: 4, color: "#667" }}>←</button>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#556" }}>Extension Demo</span>
      </div>
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #e8e8e8", overflow: "hidden", position: "relative" }}>
        <div style={{ background: "#f1f1f1", padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #e0e0e0", fontSize: 12, color: "#888" }}>
          <div style={{ display: "flex", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f57" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffbd2e" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28c940" }} />
          </div>
          <div style={{ flex: 1, background: "#fff", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#999" }}>amazon.com/dp/sunscreen-spf50</div>
        </div>
        <div style={{ padding: 24, minHeight: 360, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>☀️</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#2a3a3e", textAlign: "center" }}>SunShield UV Face Sunscreen SPF 50</h3>
          <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>GlowDerm · $24.99</p>
          <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
            {"★★★★☆".split("").map((s, i) => <span key={i} style={{ color: "#ffb800", fontSize: 16 }}>{s}</span>)}
            <span style={{ color: "#999", fontSize: 12, marginLeft: 4 }}>(2,341)</span>
          </div>
          <div style={{ marginTop: 20, background: "#f8f8f8", borderRadius: 12, padding: 14, width: "100%", fontSize: 12, color: "#777", lineHeight: 1.6 }}>
            <strong style={{ color: "#555" }}>Ingredients:</strong> Water, Homosalate, Octisalate, Zinc Oxide, Alcohol Denat, Butyloctyl Salicylate, Oxybenzone, Fragrance, Dimethicone, Glycerin, Silica, BHT, Phenoxyethanol
          </div>
        </div>
        {scanning && (
          <div className="scan-overlay">
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 70, height: 70, borderRadius: "50%", background: `linear-gradient(135deg, ${TIFFANY}, ${SEAMOSS})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", animation: "pulse 1s ease-in-out infinite", boxShadow: `0 0 40px ${TIFFANY}66` }}><span style={{ fontSize: 32 }}>🔍</span></div>
              <p style={{ color: "white", fontWeight: 600, fontSize: 15 }}>Scanning ingredients...</p>
              <div style={{ marginTop: 12, width: 180, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", background: `linear-gradient(90deg, ${TIFFANY}, ${SEAMOSS})`, borderRadius: 4, animation: "shimmer 1.5s ease-in-out infinite", backgroundSize: "200% 100%", width: "100%" }} />
              </div>
            </div>
          </div>
        )}
      </div>
      <div onClick={onScan} style={{ position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${TIFFANY}, ${SEAMOSS})`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: `0 4px 24px ${TIFFANY}55`, animation: "pulse 2s ease-in-out infinite", zIndex: 50 }}>
        <EnajLogo size={36} />
      </div>
      <p style={{ position: "fixed", bottom: 86, right: 14, background: "white", padding: "6px 12px", borderRadius: 8, fontSize: 11, color: "#556", fontWeight: 600, boxShadow: "0 2px 12px rgba(0,0,0,0.1)", animation: "fadeUp 0.5s ease" }}>← Tap to scan!</p>
    </div>
  );
}

/* ===== SCAN RESULT with reason tracing ===== */
function ScanResultScreen({ product, alternatives, userAvoid, getReasons, onBack, onHome }) {
  const matchedFlags = product.flagged.filter(f => userAvoid.some(a => f.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(f.toLowerCase())));
  const displayFlags = matchedFlags.length > 0 ? matchedFlags : product.flagged;

  return (
    <div style={{ padding: 0, minHeight: "100vh", background: "#f5f5f5" }}>
      <div style={{ background: "white", maxWidth: 420, margin: "0 auto", borderRadius: "0 0 24px 24px", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ background: `linear-gradient(135deg, ${TIFFANY}, ${SEAMOSS})`, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><EnajLogo size={26} /><span style={{ color: "white", fontWeight: 700, fontSize: 15, fontFamily: "'Playfair Display', serif" }}>enaj</span></div>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: 20, padding: "4px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600, fontFamily: "'Libre Franklin'" }}>✕ Close</button>
        </div>

        <div style={{ padding: "16px 18px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 54, height: 54, borderRadius: 14, background: "#f8f8f8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{product.image}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#2a3a3e", lineHeight: 1.3 }}>{product.name}</p>
              <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{product.brand} · {product.price}</p>
            </div>
          </div>
        </div>

        {/* Warning with ingredient-level reason tracing */}
        <div style={{ margin: "14px 18px", background: "linear-gradient(135deg, #fff5f5, #fff8f0)", border: "1.5px solid #ffdddd", borderRadius: 14, padding: 14 }}>
          <span style={{ background: "#ff4444", color: "white", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px" }}>NOT RECOMMENDED</span>
          <p style={{ fontSize: 13, color: "#664", lineHeight: 1.5, marginTop: 10, marginBottom: 12 }}>This product contains ingredients that conflict with your profile:</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {displayFlags.map(flag => {
              const reasons = getReasons(flag);
              const hasA = reasons.ailments.length > 0;
              const hasP = reasons.preferences.length > 0;
              return (
                <div key={flag} style={{ background: "#fff", borderRadius: 12, padding: "10px 12px", border: "1px solid #ffe0e0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 14 }}>⚠️</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#c44" }}>{flag}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 4 }}>
                    {hasA && reasons.ailments.map(a => (
                      <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12 }}>{a.icon}</span>
                        <span style={{ fontSize: 12, color: "#885533", lineHeight: 1.4 }}>Conflicts with your <strong style={{ color: "#aa4422" }}>{a.name}</strong></span>
                      </div>
                    ))}
                    {hasP && reasons.preferences.map(p => (
                      <div key={p} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12 }}>🚫</span>
                        <span style={{ fontSize: 12, color: "#885533", lineHeight: 1.4 }}>Flagged by your preference: <strong style={{ color: "#aa4422" }}>no {p.toLowerCase()}</strong></span>
                      </div>
                    ))}
                    {!hasA && !hasP && <span style={{ fontSize: 12, color: "#999" }}>Flagged in product scan</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Safe alternatives */}
        <div style={{ padding: "4px 18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ background: `linear-gradient(135deg, ${TIFFANY}, ${SEAMOSS})`, color: "white", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>✓ SAFE PICKS</span>
            <span style={{ fontSize: 12, color: "#888" }}>— meet all your preferences</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {alternatives.map((alt, i) => (
              <a key={i} href={alt.link} className="product-card" style={{ animation: `fadeUp 0.35s ease ${i * 0.1}s both` }}>
                <div style={{ width: 50, height: 50, borderRadius: 12, background: `linear-gradient(135deg, ${TIFFANY}12, ${SEAMOSS}08)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{alt.image}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ background: `${SEAMOSS}18`, color: SEAMOSS_DARK, borderRadius: 6, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{alt.badge}</span>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#2a3a3e", lineHeight: 1.2, marginTop: 3 }}>{alt.name}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: "#888" }}>{alt.brand}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: TIFFANY_DARK }}>{alt.price}</span>
                    <span style={{ fontSize: 11, color: "#ffb800" }}>★ {alt.rating}</span>
                  </div>
                </div>
                <div style={{ background: `linear-gradient(135deg, ${TIFFANY}, ${SEAMOSS})`, color: "white", borderRadius: 10, padding: "8px 12px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>Shop →</div>
              </a>
            ))}
          </div>
        </div>
        <div style={{ padding: "0 18px 18px" }}><button className="btn-secondary" onClick={onHome} style={{ fontSize: 13, padding: "12px 20px" }}>← Back to Dashboard</button></div>
      </div>
    </div>
  );
}
