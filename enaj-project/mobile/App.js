import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TIFFANY = '#81D8D0';
const TIFFANY_DARK = '#5CB8B2';
const SEAMOSS = '#7DB87D';
const SEAMOSS_DARK = '#5A9A5A';

// API Configuration - Change this to your server IP when testing
const API_BASE_URL = 'http://192.168.1.100:3000'; // Update with your computer's IP

// Fallback data for offline mode
const AILMENTS_DATA = [
  {
    category: "Skin Conditions",
    items: [
      { name: "Eczema", icon: "🧴", avoid: ["Fragrance/Parfum", "Sodium Lauryl Sulfate (SLS)", "Alcohol Denat", "Parabens", "Formaldehyde", "Lanolin", "Propylene Glycol"] },
      { name: "Rosacea", icon: "🌹", avoid: ["Alcohol Denat", "Fragrance/Parfum", "Menthol", "Witch Hazel", "Eucalyptus Oil", "Peppermint", "Salicylic Acid", "Retinol"] },
      { name: "Sensitive Skin", icon: "🪶", avoid: ["Fragrance/Parfum", "Alcohol Denat", "Sulfates", "Parabens", "Essential Oils", "Retinol", "Synthetic Dyes"] },
    ]
  },
  {
    category: "Digestive & Food",
    items: [
      { name: "Celiac Disease", icon: "🌾", avoid: ["Gluten", "Wheat", "Barley", "Rye", "Malt", "Brewer's Yeast"] },
      { name: "Lactose Intolerance", icon: "🥛", avoid: ["Lactose", "Milk Solids", "Whey", "Casein", "Cream", "Milk Powder"] },
      { name: "Food Allergies (Nut)", icon: "🥜", avoid: ["Tree Nuts", "Peanuts", "Peanut Oil", "Almond Extract"] },
    ]
  },
  {
    category: "Neurological & Chronic",
    items: [
      { name: "Migraines", icon: "🤕", avoid: ["Tyramine", "MSG", "Nitrates/Nitrites", "Artificial Sweeteners", "Sulfites", "Caffeine (excess)"] },
      { name: "ADHD", icon: "⚡", avoid: ["Artificial Food Dyes", "Artificial Sweeteners", "MSG", "High-Fructose Corn Syrup"] },
    ]
  },
];

const PERSONAL_PREFERENCES = [
  { category: "Artificial Additives", items: ["Artificial Sweeteners", "Artificial Colors/Dyes", "Artificial Flavors", "MSG", "High-Fructose Corn Syrup"] },
  { category: "Chemicals & Compounds", items: ["Parabens", "Phthalates", "Sulfates (SLS/SLES)", "Oxybenzone", "Triclosan"] },
  { category: "Lifestyle & Diet", items: ["Non-Organic", "GMO Ingredients", "Animal Products (Vegan)", "Dairy", "Gluten", "Seed Oils"] },
];

const DEMO_PRODUCTS = {
  scanned: {
    name: "SunShield UV Face Sunscreen SPF 50",
    brand: "GlowDerm",
    price: "$24.99",
    flagged: ["Alcohol Denat", "Fragrance/Parfum", "Oxybenzone"],
  },
  alternatives: [
    { name: "EltaMD UV Clear SPF 46", brand: "EltaMD", price: "$39.00", rating: 4.8, badge: "Dermatologist Pick" },
    { name: "La Roche-Posay Anthelios Mineral SPF 50", brand: "La Roche-Posay", price: "$33.50", rating: 4.7, badge: "Fragrance-Free" },
    { name: "Supergoop Unseen SPF 40", brand: "Supergoop!", price: "$38.00", rating: 4.6, badge: "Clean Beauty" },
  ]
};

const screens = {
  WELCOME: 'welcome',
  AILMENTS: 'ailments',
  PREFERENCES: 'preferences',
  DOWNLOAD_EXT: 'downloadExt',
  HOME: 'home',
  MONITORING: 'monitoring',
  EXTENSION_DEMO: 'extensionDemo',
  SCAN_RESULT: 'scanResult',
};

export default function App() {
  const [screen, setScreen] = useState(screens.WELCOME);
  const [selectedAilments, setSelectedAilments] = useState([]);
  const [customAilment, setCustomAilment] = useState('');
  const [selectedPrefs, setSelectedPrefs] = useState([]);
  const [userName, setUserName] = useState('');
  const [scanning, setScanning] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [removedIngredients, setRemovedIngredients] = useState({});
  const [loading, setLoading] = useState(false);
  const [ailmentsData] = useState(AILMENTS_DATA);
  const [preferencesData] = useState(PERSONAL_PREFERENCES);

  const navigateTo = (s) => setScreen(s);

  const toggleAilment = (name) => {
    setSelectedAilments(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    );
  };

  const togglePref = (name) => {
    setSelectedPrefs(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const removeIngredientFromAilment = (ailment, ingredient) => {
    setRemovedIngredients(prev => ({
      ...prev,
      [ailment]: [...(prev[ailment] || []), ingredient]
    }));
  };

  const restoreIngredientToAilment = (ailment, ingredient) => {
    setRemovedIngredients(prev => ({
      ...prev,
      [ailment]: (prev[ailment] || []).filter(i => i !== ingredient)
    }));
  };

  const getActiveIngredientsForAilment = (ailmentName) => {
    const item = ailmentsData.flatMap(c => c.items).find(i => i.name === ailmentName);
    if (!item) return [];
    return item.avoid.filter(ing => !(removedIngredients[ailmentName] || []).includes(ing));
  };

  const getRemovedIngredientsForAilment = (ailmentName) => {
    return removedIngredients[ailmentName] || [];
  };

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
        const item = ailmentsData.flatMap(c => c.items).find(i => i.name === ailmentName);
        reasons.ailments.push({ name: ailmentName, icon: item?.icon || '🩺' });
      }
    });
    
    const matchedPref = selectedPrefs.find(p => p.toLowerCase().includes(fL) || fL.includes(p.toLowerCase()));
    if (matchedPref) reasons.preferences.push(matchedPref);
    
    return reasons;
  };

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      navigateTo(screens.SCAN_RESULT);
    }, 2200);
  };

  const renderScreen = () => {
    switch (screen) {
      case screens.WELCOME:
        return <WelcomeScreen userName={userName} setUserName={setUserName} onNext={() => navigateTo(screens.AILMENTS)} loading={loading} />;
      case screens.AILMENTS:
        return <AilmentsScreen data={ailmentsData} selected={selectedAilments} onToggle={toggleAilment} customAilment={customAilment} setCustomAilment={setCustomAilment} expandedCategories={expandedCategories} toggleCategory={toggleCategory} onNext={() => navigateTo(screens.PREFERENCES)} onBack={() => navigateTo(screens.WELCOME)} loading={loading} />;
      case screens.PREFERENCES:
        return <PreferencesScreen data={preferencesData} selected={selectedPrefs} onToggle={togglePref} onNext={() => navigateTo(screens.DOWNLOAD_EXT)} onBack={() => navigateTo(screens.AILMENTS)} loading={loading} />;
      case screens.DOWNLOAD_EXT:
        return <DownloadExtScreen onNext={() => navigateTo(screens.HOME)} />;
      case screens.HOME:
        return <HomeScreen userName={userName} ailments={selectedAilments} ailmentsData={ailmentsData} avoidList={getAllAvoidIngredients()} onOpenExtDemo={() => navigateTo(screens.EXTENSION_DEMO)} onEditAilments={() => navigateTo(screens.AILMENTS)} onOpenMonitoring={() => navigateTo(screens.MONITORING)} />;
      case screens.MONITORING:
        return <MonitoringScreen ailments={selectedAilments} ailmentsData={ailmentsData} getActive={getActiveIngredientsForAilment} getRemoved={getRemovedIngredientsForAilment} onRemove={removeIngredientFromAilment} onRestore={restoreIngredientToAilment} prefs={selectedPrefs} onTogglePref={togglePref} onBack={() => navigateTo(screens.HOME)} />;
      case screens.EXTENSION_DEMO:
        return <ExtensionDemoScreen scanning={scanning} onScan={handleScan} onBack={() => navigateTo(screens.HOME)} />;
      case screens.SCAN_RESULT:
        return <ScanResultScreen product={DEMO_PRODUCTS.scanned} alternatives={DEMO_PRODUCTS.alternatives} userAvoid={getAllAvoidIngredients()} getReasons={getIngredientReasons} onBack={() => navigateTo(screens.EXTENSION_DEMO)} onHome={() => navigateTo(screens.HOME)} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {renderScreen()}
    </SafeAreaView>
  );
}

// ============== SCREENS ==============

function WelcomeScreen({ userName, setUserName, onNext, loading }) {
  return (
    <ScrollView contentContainerStyle={styles.centerContainer}>
      <LinearGradient colors={[TIFFANY, SEAMOSS]} style={styles.logoCircle}>
        <Text style={styles.logoText}>e</Text>
      </LinearGradient>
      <Text style={styles.title}>enaj</Text>
      <Text style={styles.tagline}>Putting the power of shopping back in your hands.</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>What should we call you?</Text>
        <TextInput style={styles.input} value={userName} onChangeText={setUserName} placeholder="Your first name" placeholderTextColor="#aaa" />
      </View>
      
      <TouchableOpacity style={styles.primaryButton} onPress={onNext}>
        <LinearGradient colors={[TIFFANY, SEAMOSS]} style={styles.buttonGradient}>
          <Text style={styles.buttonText}>Get Started →</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <Text style={styles.disclaimer}>By continuing, you agree to our Terms of Service.{'\n'}Your health data stays private and secure.</Text>
    </ScrollView>
  );
}

function AilmentsScreen({ data, selected, onToggle, customAilment, setCustomAilment, expandedCategories, toggleCategory, onNext, onBack }) {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <LinearGradient colors={[TIFFANY, SEAMOSS]} style={styles.smallLogoCircle}><Text style={styles.smallLogoText}>e</Text></LinearGradient>
      </View>
      
      <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={styles.screenTitle}>Your Health Profile</Text>
        <Text style={styles.screenSubtitle}>Select any conditions you have. Enaj will automatically flag ingredients known to aggravate them.</Text>
        
        {data.map(cat => (
          <View key={cat.category}>
            <TouchableOpacity style={styles.categoryHeader} onPress={() => toggleCategory(cat.category)}>
              <Text style={styles.categoryTitle}>{cat.category}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {cat.items.filter(i => selected.includes(i.name)).length > 0 && (
                  <LinearGradient colors={[TIFFANY, SEAMOSS]} style={styles.countBadge}>
                    <Text style={styles.countText}>{cat.items.filter(i => selected.includes(i.name)).length}</Text>
                  </LinearGradient>
                )}
                <Text style={[styles.expandIcon, expandedCategories[cat.category] && { transform: [{ rotate: '180deg' }] }]}>▼</Text>
              </View>
            </TouchableOpacity>
            
            {expandedCategories[cat.category] && (
              <View style={styles.chipsContainer}>
                {cat.items.map(item => (
                  <TouchableOpacity key={item.name} style={[styles.chip, selected.includes(item.name) && styles.chipSelected]} onPress={() => onToggle(item.name)}>
                    <Text>{item.icon} {item.name}</Text>
                    {selected.includes(item.name) && <Text style={{ color: SEAMOSS }}> ✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
        
        <Text style={styles.customLabel}>Have something else? Tell us:</Text>
        <TextInput style={styles.textArea} value={customAilment} onChangeText={setCustomAilment} placeholder="e.g., Histamine intolerance..." placeholderTextColor="#aaa" multiline />
      </ScrollView>
      
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.primaryButton} onPress={onNext}>
          <LinearGradient colors={[TIFFANY, SEAMOSS]} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>Continue — Set Preferences →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PreferencesScreen({ data, selected, onToggle, onNext, onBack }) {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <LinearGradient colors={[TIFFANY, SEAMOSS]} style={styles.smallLogoCircle}><Text style={styles.smallLogoText}>e</Text></LinearGradient>
      </View>
      
      <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={styles.screenTitle}>Your Preferences</Text>
        <Text style={styles.screenSubtitle}>Beyond your health conditions, select anything else you want to avoid.</Text>
        
        {data.map(cat => (
          <View key={cat.category} style={{ marginBottom: 20 }}>
            <Text style={styles.prefCategoryTitle}>{cat.category}</Text>
            <View style={styles.chipsContainer}>
              {cat.items.map(item => (
                <TouchableOpacity key={item} style={[styles.prefChip, selected.includes(item) && styles.prefChipSelected]} onPress={() => onToggle(item)}>
                  <Text style={selected.includes(item) ? { color: SEAMOSS_DARK } : {}}>{selected.includes(item) ? '✓ ' : ''}{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.primaryButton} onPress={onNext}>
          <LinearGradient colors={[TIFFANY, SEAMOSS]} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>Save & Continue →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DownloadExtScreen({ onNext }) {
  const [downloaded, setDownloaded] = useState(false);
  
  return (
    <ScrollView contentContainerStyle={styles.centerContainer}>
      <LinearGradient colors={[TIFFANY, SEAMOSS]} style={[styles.logoCircle, { width: 100, height: 100 }]}>
        <Text style={[styles.logoText, { fontSize: 40 }]}>e</Text>
      </LinearGradient>
      
      <Text style={styles.screenTitle}>Get the Browser Extension</Text>
      <Text style={[styles.screenSubtitle, { textAlign: 'center' }]}>The Enaj extension lives in the corner of your screen. Press it anytime while shopping online.</Text>
      
      <View style={{ width: '100%', maxWidth: 300, marginTop: 20 }}>
        {['🔍 Scans product ingredients instantly', '🚫 Flags ingredients you want to avoid', '💡 Suggests safe alternatives'].map((f, i) => (
          <View key={i} style={styles.featureItem}><Text>{f}</Text></View>
        ))}
      </View>
      
      {!downloaded ? (
        <TouchableOpacity style={[styles.primaryButton, { maxWidth: 300, marginTop: 30 }]} onPress={() => setDownloaded(true)}>
          <LinearGradient colors={[TIFFANY, SEAMOSS]} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>⬇️ Download Extension</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <View style={{ width: '100%', maxWidth: 300, marginTop: 20 }}>
          <View style={styles.successBox}><Text>✅ Extension Installed!</Text></View>
          <TouchableOpacity style={styles.primaryButton} onPress={onNext}>
            <LinearGradient colors={[TIFFANY, SEAMOSS]} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>Go to My Dashboard →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
      
      <TouchableOpacity onPress={onNext}><Text style={styles.skipText}>Skip for now</Text></TouchableOpacity>
    </ScrollView>
  );
}

function HomeScreen({ userName, ailments, ailmentsData, avoidList, onOpenExtDemo, onEditAilments, onOpenMonitoring }) {
  return (
    <ScrollView style={styles.screenContainer} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.homeHeader}>
        <View>
          <Text style={{ color: '#999' }}>Welcome back,</Text>
          <Text style={styles.userName}>{userName || 'Friend'} 👋</Text>
        </View>
        <LinearGradient colors={[TIFFANY, SEAMOSS]} style={styles.smallLogoCircle}><Text style={styles.smallLogoText}>e</Text></LinearGradient>
      </View>
      
      <LinearGradient colors={[TIFFANY, SEAMOSS]} style={styles.shieldCard}>
        <Text style={styles.shieldTitle}>🛡️ Your Shield is Active</Text>
        <Text style={styles.shieldText}>Enaj is monitoring {avoidList.length} ingredients across all your shopping sessions.</Text>
        <TouchableOpacity style={styles.shieldButton} onPress={onOpenExtDemo}>
          <Text style={{ color: 'white', fontWeight: '600' }}>Try Extension Demo →</Text>
        </TouchableOpacity>
      </LinearGradient>
      
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Conditions</Text>
        <TouchableOpacity onPress={onEditAilments}><Text style={{ color: TIFFANY_DARK }}>Edit</Text></TouchableOpacity>
      </View>
      <View style={styles.conditionsContainer}>
        {ailments.length > 0 ? ailments.map(a => {
          const item = ailmentsData.flatMap(c => c.items).find(i => i.name === a);
          return <View key={a} style={styles.conditionChip}><Text>{item?.icon} {a}</Text></View>;
        }) : <Text style={{ color: '#aaa' }}>No conditions added yet</Text>}
      </View>
      
      <TouchableOpacity style={styles.monitoringCard} onPress={onOpenMonitoring}>
        <Text style={{ fontSize: 22 }}>🔬</Text>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ fontWeight: '700' }}>What Enaj Monitors</Text>
          <Text style={{ color: '#888', fontSize: 12 }}>View & edit ingredients per condition</Text>
        </View>
        <Text style={{ color: TIFFANY_DARK, fontSize: 20 }}>›</Text>
      </TouchableOpacity>
      
      <View style={styles.quickActionsCard}>
        <Text style={{ fontWeight: '700', marginBottom: 12 }}>Quick Actions</Text>
        {[
          { icon: '🧩', label: 'Browser Extension', sub: 'Active & monitoring', action: onOpenExtDemo },
          { icon: '🔬', label: 'My Monitoring List', sub: `${avoidList.length} ingredients`, action: onOpenMonitoring },
          { icon: '📋', label: 'Scan History', sub: '3 products scanned' },
        ].map((item, i) => (
          <TouchableOpacity key={i} style={styles.quickActionItem} onPress={item.action}>
            <Text style={{ fontSize: 20, marginRight: 12 }}>{item.icon}</Text>
            <View style={{ flex: 1 }}><Text style={{ fontWeight: '600' }}>{item.label}</Text><Text style={{ color: '#999', fontSize: 12 }}>{item.sub}</Text></View>
            <Text style={{ color: '#ccc' }}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function MonitoringScreen({ ailments, ailmentsData, getActive, getRemoved, onRemove, onRestore, prefs, onTogglePref, onBack }) {
  const [expandedAilment, setExpandedAilment] = useState(null);
  const [showRemoved, setShowRemoved] = useState({});
  
  return (
    <View style={styles.screenContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <LinearGradient colors={[TIFFANY, SEAMOSS]} style={styles.smallLogoCircle}><Text style={styles.smallLogoText}>e</Text></LinearGradient>
      </View>
      
      <ScrollView style={styles.scrollContent}>
        <Text style={styles.screenTitle}>What Enaj Monitors</Text>
        <Text style={styles.screenSubtitle}>Tap any ingredient to remove it from monitoring.</Text>
        
        {ailments.map(ailmentName => {
          const item = ailmentsData.flatMap(c => c.items).find(i => i.name === ailmentName);
          if (!item) return null;
          const active = getActive(ailmentName);
          const removed = getRemoved(ailmentName);
          const isExpanded = expandedAilment === ailmentName;
          
          return (
            <View key={ailmentName} style={{ marginBottom: 12 }}>
              <TouchableOpacity style={[styles.monitorAilmentHeader, isExpanded && { borderColor: TIFFANY }]} onPress={() => setExpandedAilment(isExpanded ? null : ailmentName)}>
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ fontWeight: '700' }}>{ailmentName}</Text>
                  <Text style={{ color: '#888', fontSize: 12 }}>{active.length} monitored{removed.length > 0 ? ` · ${removed.length} dismissed` : ''}</Text>
                </View>
                <Text style={[styles.expandIcon, isExpanded && { transform: [{ rotate: '180deg' }] }]}>▼</Text>
              </TouchableOpacity>
              
              {isExpanded && (
                <View style={{ padding: 10 }}>
                  <Text style={{ color: SEAMOSS_DARK, fontSize: 11, marginBottom: 8 }}>ACTIVE — TAP TO DISMISS</Text>
                  <View style={styles.chipsContainer}>
                    {active.map(ing => (
                      <TouchableOpacity key={ing} style={styles.ingredientChip} onPress={() => onRemove(ailmentName, ing)}>
                        <Text style={{ color: TIFFANY_DARK, fontSize: 12 }}>🚫 {ing} ✕</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  {removed.length > 0 && (
                    <>
                      <TouchableOpacity onPress={() => setShowRemoved(p => ({ ...p, [ailmentName]: !p[ailmentName] }))}>
                        <Text style={{ color: '#999', marginTop: 10 }}>{showRemoved[ailmentName] ? 'Hide' : 'Show'} dismissed ({removed.length}) ›</Text>
                      </TouchableOpacity>
                      {showRemoved[ailmentName] && (
                        <View style={[styles.chipsContainer, { marginTop: 8 }]}>
                          {removed.map(ing => (
                            <TouchableOpacity key={ing} style={styles.ingredientChipRemoved} onPress={() => onRestore(ailmentName, ing)}>
                              <Text style={{ color: '#999', fontSize: 12, textDecorationLine: 'line-through' }}>{ing} ↩</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}
            </View>
          );
        })}
        
        <Text style={[styles.screenTitle, { marginTop: 24, fontSize: 18 }]}>Personal Preferences</Text>
        <View style={styles.chipsContainer}>
          {prefs.map(p => (
            <TouchableOpacity key={p} style={styles.prefIngredientChip} onPress={() => onTogglePref(p)}>
              <Text style={{ color: SEAMOSS_DARK, fontSize: 12 }}>🚫 {p} ✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function ExtensionDemoScreen({ scanning, onScan, onBack }) {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <Text style={{ fontWeight: '600' }}>Extension Demo</Text>
      </View>
      
      <View style={styles.browserMock}>
        <View style={styles.browserBar}>
          <View style={{ flexDirection: 'row' }}>
            <View style={[styles.browserDot, { backgroundColor: '#ff5f57' }]} />
            <View style={[styles.browserDot, { backgroundColor: '#ffbd2e' }]} />
            <View style={[styles.browserDot, { backgroundColor: '#28c940' }]} />
          </View>
          <View style={styles.browserUrl}><Text style={{ color: '#999', fontSize: 11 }}>amazon.com/dp/sunscreen</Text></View>
        </View>
        
        <View style={styles.productPage}>
          <Text style={{ fontSize: 50 }}>☀️</Text>
          <Text style={styles.productName}>SunShield UV Face Sunscreen SPF 50</Text>
          <Text style={{ color: '#888' }}>GlowDerm · $24.99</Text>
          <Text style={{ color: '#ffb800' }}>★★★★☆ (2,341)</Text>
          <View style={styles.ingredientsBox}>
            <Text style={{ fontWeight: '600', marginBottom: 4 }}>Ingredients:</Text>
            <Text style={{ color: '#777', fontSize: 12 }}>Water, Homosalate, Zinc Oxide, Alcohol Denat, Oxybenzone, Fragrance...</Text>
          </View>
        </View>
        
        {scanning && (
          <View style={styles.scanOverlay}>
            <LinearGradient colors={[TIFFANY, SEAMOSS]} style={styles.scanCircle}>
              <Text style={{ fontSize: 32 }}>🔍</Text>
            </LinearGradient>
            <Text style={{ color: 'white', fontWeight: '600', marginTop: 16 }}>Scanning ingredients...</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity style={styles.floatingButton} onPress={onScan}>
        <LinearGradient colors={[TIFFANY, SEAMOSS]} style={styles.floatingButtonGradient}>
          <Text style={{ color: 'white', fontSize: 24, fontWeight: '800' }}>e</Text>
        </LinearGradient>
      </TouchableOpacity>
      <View style={styles.tapHint}><Text style={{ fontSize: 11, fontWeight: '600' }}>← Tap to scan!</Text></View>
    </View>
  );
}

function ScanResultScreen({ product, alternatives, userAvoid, getReasons, onBack, onHome }) {
  const matchedFlags = product.flagged.filter(f => userAvoid.some(a => f.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(f.toLowerCase())));
  const displayFlags = matchedFlags.length > 0 ? matchedFlags : product.flagged;
  
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <LinearGradient colors={[TIFFANY, SEAMOSS]} style={styles.scanResultHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.scanResultLogo}><Text style={{ color: 'white', fontWeight: '800' }}>e</Text></View>
          <Text style={{ color: 'white', fontWeight: '700', marginLeft: 8 }}>enaj</Text>
        </View>
        <TouchableOpacity onPress={onBack}><Text style={{ color: 'white' }}>✕ Close</Text></TouchableOpacity>
      </LinearGradient>
      
      <View style={styles.scannedProduct}>
        <View style={styles.scannedProductImage}><Text style={{ fontSize: 28 }}>☀️</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700' }}>{product.name}</Text>
          <Text style={{ color: '#888', fontSize: 12 }}>{product.brand} · {product.price}</Text>
        </View>
      </View>
      
      <View style={styles.warningBox}>
        <View style={styles.warningBadge}><Text style={{ color: 'white', fontWeight: '700', fontSize: 11 }}>NOT RECOMMENDED</Text></View>
        <Text style={{ marginTop: 10, color: '#664' }}>This product contains ingredients that conflict with your profile:</Text>
        
        {displayFlags.map(flag => {
          const reasons = getReasons(flag);
          return (
            <View key={flag} style={styles.flaggedItem}>
              <Text style={{ fontWeight: '700', color: '#c44' }}>⚠️ {flag}</Text>
              {reasons.ailments.map(a => (
                <Text key={a.name} style={{ color: '#885533', fontSize: 12, marginTop: 4 }}>{a.icon} Conflicts with your <Text style={{ fontWeight: '700' }}>{a.name}</Text></Text>
              ))}
              {reasons.preferences.map(p => (
                <Text key={p} style={{ color: '#885533', fontSize: 12, marginTop: 4 }}>🚫 Preference: no {p.toLowerCase()}</Text>
              ))}
            </View>
          );
        })}
      </View>
      
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <LinearGradient colors={[TIFFANY, SEAMOSS]} style={styles.safeBadge}><Text style={{ color: 'white', fontWeight: '700', fontSize: 11 }}>✓ SAFE PICKS</Text></LinearGradient>
          <Text style={{ color: '#888', marginLeft: 8 }}>— meet your preferences</Text>
        </View>
        
        {alternatives.map((alt, i) => (
          <View key={i} style={styles.alternativeCard}>
            <View style={styles.alternativeImage}><Text style={{ fontSize: 24 }}>🧴</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: SEAMOSS_DARK, fontSize: 10, fontWeight: '700' }}>{alt.badge}</Text>
              <Text style={{ fontWeight: '600' }}>{alt.name}</Text>
              <Text style={{ color: '#888', fontSize: 12 }}>{alt.brand} · {alt.price} · ★{alt.rating}</Text>
            </View>
            <LinearGradient colors={[TIFFANY, SEAMOSS]} style={styles.shopButton}>
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 11 }}>Shop →</Text>
            </LinearGradient>
          </View>
        ))}
      </View>
      
      <TouchableOpacity style={styles.backToDashboard} onPress={onHome}>
        <Text style={{ color: TIFFANY_DARK, fontWeight: '600' }}>← Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ============== STYLES ==============

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0faf9' },
  centerContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  screenContainer: { flex: 1, backgroundColor: '#f0faf9' },
  
  logoCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  logoText: { color: 'white', fontSize: 48, fontWeight: '800', fontFamily: 'serif' },
  smallLogoCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  smallLogoText: { color: 'white', fontSize: 16, fontWeight: '800' },
  
  title: { fontSize: 44, fontWeight: '700', color: TIFFANY_DARK, marginTop: 20 },
  tagline: { color: '#7a8a8e', fontSize: 14, marginTop: 8, textAlign: 'center', letterSpacing: 1 },
  
  inputContainer: { width: '100%', maxWidth: 340, marginTop: 40 },
  inputLabel: { color: '#556', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: '#e4e4e4', fontSize: 16 },
  
  primaryButton: { width: '100%', maxWidth: 340, marginTop: 24, borderRadius: 50, overflow: 'hidden' },
  buttonGradient: { padding: 16, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  
  disclaimer: { marginTop: 24, color: '#aab', fontSize: 12, textAlign: 'center' },
  
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  backText: { fontSize: 24, color: '#667' },
  
  scrollContent: { flex: 1, paddingHorizontal: 20 },
  screenTitle: { fontSize: 26, fontWeight: '600', color: '#2a3a3e', marginBottom: 6 },
  screenSubtitle: { color: '#7a8a8e', fontSize: 14, marginBottom: 20, lineHeight: 20 },
  
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 14, borderRadius: 16, marginBottom: 8, borderWidth: 1.5, borderColor: '#f0f0f0' },
  categoryTitle: { fontWeight: '600', color: '#3a4a4e' },
  countBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 20, marginRight: 8 },
  countText: { color: 'white', fontSize: 12, fontWeight: '600' },
  expandIcon: { color: '#aab', fontSize: 12 },
  
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { backgroundColor: 'white', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 25, borderWidth: 2, borderColor: '#e0e0e0' },
  chipSelected: { borderColor: TIFFANY, backgroundColor: `${TIFFANY}18` },
  
  prefCategoryTitle: { fontSize: 12, fontWeight: '700', color: SEAMOSS_DARK, marginBottom: 10, letterSpacing: 1 },
  prefChip: { backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#e8e8e8' },
  prefChipSelected: { borderColor: SEAMOSS, backgroundColor: `${SEAMOSS}15` },
  
  customLabel: { fontWeight: '600', color: '#556', marginBottom: 8, marginTop: 16 },
  textArea: { backgroundColor: 'white', padding: 14, borderRadius: 14, borderWidth: 2, borderColor: '#e8e8e8', minHeight: 80, textAlignVertical: 'top' },
  
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 30, backgroundColor: '#f0faf9ee' },
  
  featureItem: { backgroundColor: 'white', padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#f0f0f0' },
  successBox: { backgroundColor: `${SEAMOSS}15`, padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: `${SEAMOSS}44` },
  skipText: { color: '#99a', marginTop: 16, textDecorationLine: 'underline' },
  
  homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  userName: { fontSize: 26, fontWeight: '600', color: '#2a3a3e' },
  
  shieldCard: { borderRadius: 20, padding: 24, marginBottom: 20 },
  shieldTitle: { color: 'white', fontSize: 17, fontWeight: '700', marginBottom: 6 },
  shieldText: { color: 'white', opacity: 0.9, lineHeight: 20 },
  shieldButton: { marginTop: 16, backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 30, alignItems: 'center' },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#3a4a4e' },
  
  conditionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  conditionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: `${TIFFANY}12`, borderWidth: 1.5, borderColor: `${TIFFANY}33` },
  
  monitoringCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: `${TIFFANY}33`, marginBottom: 20 },
  
  quickActionsCard: { backgroundColor: 'white', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#f0f0f0' },
  quickActionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  
  monitorAilmentHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 14, borderRadius: 16, borderWidth: 2, borderColor: '#f0f0f0' },
  
  ingredientChip: { backgroundColor: `${TIFFANY}10`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1.5, borderColor: `${TIFFANY}44` },
  ingredientChipRemoved: { backgroundColor: '#f8f8f8', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1.5, borderColor: '#ddd' },
  prefIngredientChip: { backgroundColor: `${SEAMOSS}10`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1.5, borderColor: `${SEAMOSS}44` },
  
  browserMock: { flex: 1, margin: 20, backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#e8e8e8', overflow: 'hidden' },
  browserBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f1f1', padding: 10, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  browserDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  browserUrl: { flex: 1, backgroundColor: 'white', padding: 6, borderRadius: 6, marginLeft: 10 },
  
  productPage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  productName: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 16 },
  ingredientsBox: { backgroundColor: '#f8f8f8', borderRadius: 12, padding: 14, marginTop: 20, width: '100%' },
  
  scanOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  scanCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  
  floatingButton: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28 },
  floatingButtonGradient: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  tapHint: { position: 'absolute', bottom: 86, right: 20, backgroundColor: 'white', padding: 8, borderRadius: 8, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  
  scanResultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  scanResultLogo: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  
  scannedProduct: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  scannedProductImage: { width: 54, height: 54, borderRadius: 14, backgroundColor: '#f8f8f8', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  
  warningBox: { margin: 14, backgroundColor: '#fff8f5', borderWidth: 1.5, borderColor: '#ffdddd', borderRadius: 14, padding: 14 },
  warningBadge: { backgroundColor: '#ff4444', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  flaggedItem: { backgroundColor: 'white', borderRadius: 12, padding: 10, marginTop: 10, borderWidth: 1, borderColor: '#ffe0e0' },
  
  safeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  
  alternativeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1.5, borderColor: '#f0f0f0' },
  alternativeImage: { width: 50, height: 50, borderRadius: 12, backgroundColor: `${TIFFANY}12`, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  shopButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  
  backToDashboard: { margin: 16, marginBottom: 30, padding: 14, backgroundColor: 'white', borderRadius: 50, alignItems: 'center', borderWidth: 2, borderColor: TIFFANY },
});
