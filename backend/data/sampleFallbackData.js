/**
 * CropShield High-Quality Sample & Fallback Agricultural Knowledge Base
 * Used for instant demo responses and reliable fallback when Gemini API hits free-tier rate limits.
 */

export const DEMO_DIAGNOSES = {
  // 1. Potato Early Blight
  potato: {
    identification: {
      crop: 'Potato',
      pest_label: 'Early Blight (Alternaria solani)',
      confidence: 0.94,
      notes: 'Concentric dark brown rings (target board spots) observed on lower foliage indicating fungal Early Blight.',
    },
    treatments: {
      Hindi: {
        pest_name: 'Early Blight',
        pest_name_local: 'अगेती झुलसा (Early Blight)',
        severity: 'medium',
        organic_remedy: 'नीम का तेल (5ml/लीटर) और 10% गौमूत्र का छिड़काव करें। ट्राइकोडर्मा विरिडी (Trichoderma viride) 5 ग्राम प्रति लीटर पानी में मिलाकर पत्तियों पर छिड़कें।',
        chemical_remedy: {
          name: 'Mancozeb 75% WP या Copper Oxychloride 50% WP',
          product_brands: ['Indofil M-45', 'Dithane M-45', 'Blitox 50'],
          dosage_ml_per_litre: '2.5 ग्राम प्रति लीटर',
          frequency_days: '10-12 दिन के अंतराल पर 2 बार',
          estimated_cost_inr: '₹350 - ₹550 प्रति एकड़',
        },
        safety: 'दवा छिड़कते समय चेहरे पर मास्क और दस्ताने अवश्य पहनें। हवा की विपरीत दिशा में छिड़काव न करें।',
        tts_short: 'किसान भाई, आपके आलू की फसल में अगेती झुलसा के लक्षण हैं। तुरंत मैन्कोजेब या नीम तेल का छिड़काव करें।',
        notes: 'रोगग्रस्त निचली पत्तियों को तोड़कर खेत से दूर नष्ट कर दें।',
        weather_risk_label: 'medium',
        weather_advice: 'हवा में अधिक नमी और 25-30°C तापमान इस फफूंद को बढ़ाता है। खेत में जलभराव न होने दें।',
        local_language_explanation: 'आलू की पत्तियों पर भूरे-काले छल्लेदार धब्बे बनना अगेती झुलसा रोग का मुख्य लक्षण है। समय पर रोकथाम न करने पर कंदों का आकार छोटा रह जाता है।',
        cause: 'अल्टरनेरिया सोलानी नामक फफूंद, जो उच्च आर्द्रता और गर्म मौसम में तेजी से फैलती है।',
        preventive_measures: [
          'प्रमाणित और रोगमुक्त बीजों का ही उपयोग करें।',
          'फसल चक्र (Crop Rotation) अपनाएं और सोलेनेसी कुल की फसलें लगातार न लगाएं।',
          'खेत में उचित जलनिकासी की व्यवस्था रखें।',
        ],
      },
      English: {
        pest_name: 'Early Blight',
        pest_name_local: 'Early Blight (Alternaria solani)',
        severity: 'medium',
        organic_remedy: 'Spray Neem Seed Kernel Extract (5ml/L) or Trichoderma viride bio-fungicide (5g/L).',
        chemical_remedy: {
          name: 'Mancozeb 75% WP / Chlorothalonil 75% WP',
          product_brands: ['Indofil M-45', 'Kavach', 'Dithane M-45'],
          dosage_ml_per_litre: '2.5 g per litre of water',
          frequency_days: 'Repeat after 10-12 days if spots persist',
          estimated_cost_inr: '₹350 - ₹550 per acre',
        },
        safety: 'Wear protective mask and gloves while spraying fungicides.',
        tts_short: 'Your potato crop shows signs of Early Blight. Apply Mancozeb or organic Neem spray promptly.',
        notes: 'Remove infected bottom foliage to prevent spore splash.',
        weather_risk_label: 'medium',
        weather_advice: 'High humidity and warm temperatures promote fungal growth. Avoid overhead irrigation.',
        local_language_explanation: 'Early blight causes dark target-board concentric spots on older leaves, reducing yield if untreated.',
        cause: 'Fungal pathogen Alternaria solani surviving in plant debris.',
        preventive_measures: [
          'Use certified disease-resistant seed tubers.',
          'Practice crop rotation avoiding tomato and potato sequences.',
          'Ensure well-drained soilbeds.',
        ],
      },
      Bengali: {
        pest_name: 'Early Blight',
        pest_name_local: 'আলুর আগাম ধ্বসা রোগ (Early Blight)',
        severity: 'medium',
        organic_remedy: 'নিম তেল (প্রতি লিটারে ৫ মিলি) বা ট্রাইকোডার্মা ভিরিডি স্প্রে করুন।',
        chemical_remedy: {
          name: 'ম্যানকোজেব ৭৫% ডব্লিউপি (Mancozeb)',
          product_brands: ['Indofil M-45', 'Dithane M-45'],
          dosage_ml_per_litre: '২.৫ গ্রাম প্রতি লিটার জলে',
          frequency_days: '১০-১২ দিন পর পুনরায় স্প্রে করুন',
          estimated_cost_inr: '₹৩৫০ - ₹৫৫০ প্রতি একর',
        },
        safety: 'কীটনাশক ব্যবহারের সময় মাস্ক ও গ্লাভস ব্যবহার করুন।',
        tts_short: 'আলু গাছে আগাম ধ্বসা রোগ দেখা দিয়েছে। দ্রুত ম্যানকোজেব স্প্রে করার পরামর্শ দেওয়া হচ্ছে।',
        notes: 'আক্রান্ত পাতা ছিঁড়ে নষ্ট করে ফেলুন।',
        weather_risk_label: 'medium',
        weather_advice: 'বাতাসে আর্দ্রতা বেশি থাকলে ছত্রাকের বিস্তার বাড়ে। জমিতে জল জমতে দেবেন না।',
        local_language_explanation: 'পাতায় গোল গোল বাদামী বলয়ের মতো দাগ এই রোগের প্রধান লক্ষণ। সঠিক পরিচর্যায় রোগ দ্রুত সারে।',
        cause: 'অল্টারনারিয়া সোলানি ছত্রাকের আক্রমণ।',
        preventive_measures: [
          'শোধন করা বীজ আলু ব্যবহার করুন।',
          'পর্যাপ্ত জৈব সার ও সুষম পটাশ ব্যবহার করুন।',
          'একই জমিতে বারবার আলু চাষ করবেন না।',
        ],
      },
    },
  },

  // 2. Tomato Hornworm & Blight
  tomato: {
    identification: {
      crop: 'Tomato',
      pest_label: 'Tomato Hornworm / Leaf Blight',
      confidence: 0.91,
      notes: 'Defoliation and localized leaf lesions characteristic of pest damage and secondary fungal stress.',
    },
    treatments: {
      Hindi: {
        pest_name: 'Tomato Hornworm / Blight',
        pest_name_local: 'टमाटर का सुंडी कीट व पत्ती धब्बा',
        severity: 'high',
        organic_remedy: 'हाथ से कीड़ों को चुनकर नष्ट करें। बैसिलस थुरिंजिएंसिस (Bacillus thuringiensis - Bt) 2ml प्रति लीटर पानी में मिलाकर शाम को छिड़कें।',
        chemical_remedy: {
          name: 'Spinosad 45% SC या Emamectin Benzoate 5% SG',
          product_brands: ['Tracer', 'Proclaim', 'EM-1'],
          dosage_ml_per_litre: '0.5 ml प्रति लीटर',
          frequency_days: '15 दिन के अंतराल पर आवश्यकतानुसार',
          estimated_cost_inr: '₹400 - ₹650 प्रति एकड़',
        },
        safety: 'फल तुड़ाई से कम से कम 3 दिन पहले तक रासायनिक छिड़काव बंद कर दें।',
        tts_short: 'टमाटर की फसल में पत्ती खाने वाले कीड़े हैं। स्पिनोसैड या नीम कीटनाशक का छिड़काव तुरंत करें।',
        notes: 'शाम के समय छिड़काव करने से सर्वोत्तम परिणाम मिलते हैं।',
        weather_risk_label: 'low',
        weather_advice: 'धूप निकलने पर कीट अधिक सक्रिय होते हैं, खेत की नियमित निगरानी करें।',
        local_language_explanation: 'टमाटर की पत्तियों और कलियों को तेजी से खाकर नष्ट करने वाले कीड़ों से फसल की सुरक्षा आवश्यक है।',
        cause: 'मैंडुका कीट के लार्वा और फफूंद जनित संक्रमण।',
        preventive_measures: [
          'खेत की गहरी जुताई करें ताकि प्यूपा नष्ट हो जाएं।',
          'टमाटर के चारों ओर गेंदा (Marigold) की फसल लगाएं।',
          'फेरोमोन ट्रैप लगाएं।',
        ],
      },
      English: {
        pest_name: 'Tomato Hornworm',
        pest_name_local: 'Tomato Hornworm / Caterpillar',
        severity: 'high',
        organic_remedy: 'Hand-pick caterpillars and spray Bacillus thuringiensis (Bt) or Neem oil (5ml/L).',
        chemical_remedy: {
          name: 'Spinosad 45% SC or Emamectin Benzoate 5% SG',
          product_brands: ['Tracer', 'Proclaim', 'Coragen'],
          dosage_ml_per_litre: '0.5 ml per litre of water',
          frequency_days: 'Spray in the evening as needed',
          estimated_cost_inr: '₹400 - ₹650 per acre',
        },
        safety: 'Observe a 3-day pre-harvest waiting interval after chemical application.',
        tts_short: 'Tomato Hornworm pest detected. Apply Spinosad or organic Bt spray immediately.',
        notes: 'Inspect undersides of leaves and early green fruits.',
        weather_risk_label: 'low',
        weather_advice: 'Pests thrive in dry warm weather; maintain optimal irrigation.',
        local_language_explanation: 'Caterpillars cause rapid foliage loss and chew directly into developing tomatoes.',
        cause: 'Larval feeding of Manduca species.',
        preventive_measures: [
          'Deep plowing before transplanting.',
          'Intercrop with marigolds as natural trap crops.',
          'Install solar or pheromone light traps.',
        ],
      },
      Bengali: {
        pest_name: 'Tomato Hornworm',
        pest_name_local: 'টমেটোর লেদা পোকা ও পাতা পোড়া',
        severity: 'high',
        organic_remedy: 'হাতে পোকা বেছে নষ্ট করুন এবং জৈব নিম তেল বা বিটি স্প্রে করুন।',
        chemical_remedy: {
          name: 'স্পিনোস্যাড ৪৫% এসসি (Spinosad)',
          product_brands: ['Tracer', 'Proclaim'],
          dosage_ml_per_litre: '০.৫ মিলি প্রতি লিটার জলে',
          frequency_days: 'বিকেলের দিকে স্প্রে করুন',
          estimated_cost_inr: '₹৪০০ - ₹৬৫০ প্রতি একর',
        },
        safety: 'ফল তোলার অন্তত ৩ দিন আগে স্প্রে বন্ধ করুন।',
        tts_short: 'টমেটো গাছে ক্ষতিকারক পোকার আক্রমণ হয়েছে। স্পিনোস্যাড স্প্রে করুন।',
        notes: 'গাছের পাতার নিচে লক্ষ্য রাখুন।',
        weather_risk_label: 'low',
        weather_advice: 'শুষ্ক আবহাওয়ায় পোকার উপদ্রব বাড়ে।',
        local_language_explanation: 'লেদা পোকা দ্রুত পাতা এবং কচি ফল খেয়ে ক্ষতি করে।',
        cause: 'কীটপতঙ্গের লার্ভা সংক্রমণ।',
        preventive_measures: [
          'জমি গভীরভাবে চাষ দিন।',
          'জমির চারধারে গাঁদা ফুল গাছ লাগান।',
          'আলোর ফাঁদ ব্যবহার করুন।',
        ],
      },
    },
  },

  // 3. Corn / Maize Rust
  corn: {
    identification: {
      crop: 'Corn (Maize)',
      pest_label: 'Southern Corn Rust (Puccinia polysora)',
      confidence: 0.92,
      notes: 'Orange-golden powdery pustules scattered across both leaf surfaces indicative of Southern Corn Rust.',
    },
    treatments: {
      Hindi: {
        pest_name: 'Corn Rust',
        pest_name_local: 'मक्का का गेरुआ / रतुआ रोग (Corn Rust)',
        severity: 'medium',
        organic_remedy: 'खट्टी छाछ (50ml/लीटर) और 5% नीम तेल का छिड़काव करें।',
        chemical_remedy: {
          name: 'Azoxystrobin 18.2% + Difenoconazole 11.4% SC',
          product_brands: ['Amistar Top', 'Custodia', 'Tilt'],
          dosage_ml_per_litre: '1 ml प्रति लीटर पानी',
          frequency_days: 'रोग के लक्षण दिखने पर 1 बार, 14 दिन बाद पुनः',
          estimated_cost_inr: '₹500 - ₹750 प्रति एकड़',
        },
        safety: 'हवा की दिशा में स्प्रे करें और बच्चों से कीटनाशक दूर रखें।',
        tts_short: 'मक्के की पत्तियों पर रतुआ रोग के लक्षण हैं। एमिस्टार टॉप या प्रोपिकोनाज़ोल का छिड़काव करें।',
        notes: 'पत्तियों पर नारंगी-भूरा पाउडर दिखने पर तुरंत उपचार करें।',
        weather_risk_label: 'high',
        weather_advice: 'गर्म और उमस भरा मौसम रतुआ रोग को तेजी से फैलाता है।',
        local_language_explanation: 'मक्के की पत्तियों पर उभरे हुए नारंगी धब्बे प्रकाश संश्लेषण को धीमा कर देते हैं जिससे भुट्टे का वजन कम होता है।',
        cause: 'पक्सीनिया पॉलीसिनोरिया फफूंद के बीजाणु।',
        preventive_measures: [
          'रोग प्रतिरोधी संकर मक्का किस्मों की बुवाई करें।',
          'संतुलित पोटाश और नाइट्रोजन का उपयोग करें।',
          'पौधों के बीच उचित दूरी (60x20 सेमी) रखें।',
        ],
      },
      English: {
        pest_name: 'Southern Corn Rust',
        pest_name_local: 'Southern Corn Rust (Puccinia polysora)',
        severity: 'medium',
        organic_remedy: 'Apply fermented buttermilk solution or bio-fungicide Bacillus subtilis.',
        chemical_remedy: {
          name: 'Azoxystrobin 18.2% + Difenoconazole 11.4% SC',
          product_brands: ['Amistar Top', 'Tilt (Propiconazole)', 'Custodia'],
          dosage_ml_per_litre: '1 ml per litre of water',
          frequency_days: 'Spray upon first detection, repeat in 14 days if needed',
          estimated_cost_inr: '₹500 - ₹750 per acre',
        },
        safety: 'Always wear eye protection and protective gloves while handling fungicides.',
        tts_short: 'Southern Rust detected on corn foliage. Spray Amistar Top or Tilt fungicide promptly.',
        notes: 'Orange pustules break through the leaf epidermis.',
        weather_risk_label: 'high',
        weather_advice: 'Warm, humid tropical conditions accelerate rust sporulation.',
        local_language_explanation: 'Pustules destroy photosynthetic leaf area, reducing kernel fill and overall cob weight.',
        cause: 'Windborne fungal spores of Puccinia polysora.',
        preventive_measures: [
          'Plant certified rust-resistant hybrids.',
          'Avoid excessive late nitrogen fertilization.',
          'Ensure adequate plant spacing for airflow.',
        ],
      },
      Bengali: {
        pest_name: 'Corn Rust',
        pest_name_local: 'ভুট্টার মরিচা রোগ (Corn Rust)',
        severity: 'medium',
        organic_remedy: 'নিম তেল বা টক দইয়ের জল ৫% হারে স্প্রে করুন।',
        chemical_remedy: {
          name: 'প্রপিকোনাজোল ২৫% ইসি বা অ্যামিস্টার টপ',
          product_brands: ['Tilt', 'Amistar Top'],
          dosage_ml_per_litre: '১ মিলি প্রতি লিটার জলে',
          frequency_days: '১৪ দিনের ব্যবধানে ২ বার',
          estimated_cost_inr: '₹৫০০ - ₹৭৫০ প্রতি একর',
        },
        safety: 'স্প্রে করার সময় সতর্কতা অবলম্বন করুন।',
        tts_short: 'ভুট্টায় মরিচা রোগ দেখা দিয়েছে। টিল্ট বা অ্যামিস্টার টপ স্প্রে করুন।',
        notes: 'পাতার উপরে হলদেটে-কমলা গুঁড়ো লক্ষ্য করা যায়।',
        weather_risk_label: 'high',
        weather_advice: 'উষ্ণ এবং স্যাঁতসেঁতে আবহাওয়া এই রোগের জন্য অনুকূল।',
        local_language_explanation: 'মরিচা রোগের কারণে গাছের পাতা শুকিয়ে যায় এবং মোচার দানা পুষ্ট হয় না।',
        cause: 'পাক্সিনিয়া ছত্রাক সংক্রমণ।',
        preventive_measures: [
          'উন্নত রোগ প্রতিরোধী জাতের বীজ নির্বাচন করুন।',
          'সুষম সার প্রয়োগ করুন।',
          'গাছের মাঝে সঠিক দূরত্ব বজায় রাখুন।',
        ],
      },
    },
  },

  // 4. Default / Healthy Crop
  default: {
    identification: {
      crop: 'Wheat / Agricultural Crop',
      pest_label: 'Healthy Foliage / Minor Nutrient Stress',
      confidence: 0.88,
      notes: 'Crop foliage displays healthy green coloration with minimal abiotic stress symptoms.',
    },
    treatments: {
      Hindi: {
        pest_name: 'Healthy Crop',
        pest_name_local: 'स्वस्थ फसल (Healthy Crop)',
        severity: 'low',
        organic_remedy: '19:19:19 घुलनशील NPK खाद (5 ग्राम/लीटर) और 2% सीवीड एक्सट्रैक्ट का पर्णीय छिड़काव करें।',
        chemical_remedy: {
          name: 'माइक्रोन्यूट्रिएंट मिश्रण (Zinc + Boron + Iron)',
          product_brands: ['Multiplex Zinc', 'Anand Agro Nutri', 'Tata Bahaar'],
          dosage_ml_per_litre: '2 ग्राम प्रति लीटर',
          frequency_days: '25-30 दिन के अंतराल पर वृद्धि के दौरान',
          estimated_cost_inr: '₹200 - ₹350 प्रति एकड़',
        },
        safety: 'खाद का घोल धूप निकलने के बाद सुबह या शाम को छिड़कें।',
        tts_short: 'आपकी फसल बिल्कुल स्वस्थ है। अच्छी पैदावार के लिए सूक्ष्म पोषक तत्वों का नियमित छिड़काव जारी रखें।',
        notes: 'फसल की नियमित निगरानी और उचित सिंचाई जारी रखें।',
        weather_risk_label: 'low',
        weather_advice: 'वर्तमान मौसम फसल की बढ़वार के लिए अनुकूल है।',
        local_language_explanation: 'फसल की पत्तियां हरी-भरी और स्वस्थ हैं। पौधों को मजबूत बनाने के लिए समय पर पोषण दें।',
        cause: 'उचित कृषि प्रबंधन और समय पर सिंचाई।',
        preventive_measures: [
          'नियमित रूप से खरपतवार निकालते रहें।',
          'मिट्टी की नमी अनुसार सिंचाई का समय तय करें।',
          'फसल सुरक्षा के लिए समय पर कीट निगरानी करें।',
        ],
      },
      English: {
        pest_name: 'Healthy Crop',
        pest_name_local: 'Healthy Crop / General Nutrition',
        severity: 'low',
        organic_remedy: 'Apply water-soluble 19:19:19 NPK foliar spray (5g/L) with Seaweed Extract.',
        chemical_remedy: {
          name: 'Chelated Micronutrient Fertilizer (Zn, Fe, B)',
          product_brands: ['Tata Bahaar', 'Multiplex Gold', 'Nutri-Mix'],
          dosage_ml_per_litre: '2 g per litre of water',
          frequency_days: 'During vegetative and flowering stages',
          estimated_cost_inr: '₹200 - ₹350 per acre',
        },
        safety: 'Spray during cool morning or evening hours for best nutrient absorption.',
        tts_short: 'Your crop is in healthy condition. Maintain scheduled irrigation and balanced micronutrients.',
        notes: 'Continue standard agronomic practices.',
        weather_risk_label: 'low',
        weather_advice: 'Weather conditions are favorable for vegetative growth.',
        local_language_explanation: 'No major pathogen detected. Foliage displays active chlorophyll and vigor.',
        cause: 'Good agricultural practices and soil nutrition.',
        preventive_measures: [
          'Maintain regular weeding.',
          'Optimize drip or furrow irrigation schedules.',
          'Periodically inspect leaf undersides for early pest presence.',
        ],
      },
      Bengali: {
        pest_name: 'Healthy Crop',
        pest_name_local: 'সুস্থ ফসল (Healthy Crop)',
        severity: 'low',
        organic_remedy: '১৯:১৯:১৯ এনপিকে এবং জৈব সি-উইড স্প্রে করুন।',
        chemical_remedy: {
          name: 'মাইক্রোনিউট্রিয়েন্ট বা অনুখাদ্য মিশ্রণ',
          product_brands: ['Tata Bahaar', 'Multiplex'],
          dosage_ml_per_litre: '২ গ্রাম প্রতি লিটার জলে',
          frequency_days: 'গাছের বৃদ্ধির সময়',
          estimated_cost_inr: '₹২০০ - ₹৩৫০ প্রতি একর',
        },
        safety: 'সকালের দিকে সার স্প্রে করুন।',
        tts_short: 'আপনার ফসল বেশ সুস্থ রয়েছে। ফলন বৃদ্ধির জন্য অনুখাদ্য স্প্রে করতে পারেন।',
        notes: 'নিয়মিত সেচ ও পরিচর্যা বজায় রাখুন।',
        weather_risk_label: 'low',
        weather_advice: 'বর্তমান আবহাওয়া ফসলের জন্য সহায়ক।',
        local_language_explanation: 'ফসল রোগমুক্ত রয়েছে। নিয়মিত নজরদারি বজায় রাখুন।',
        cause: 'সঠিক পরিচর্যা ও সার প্রয়োগ।',
        preventive_measures: [
          'নিয়মিত আগাছা দমন করুন।',
          'পরিমিত সেচ দিন।',
          'মাটির স্বাস্থ্য পরীক্ষা করুন।',
        ],
      },
    },
  },
};

/**
 * Smart Farm Yield Master Fallbacks
 */
export const DEMO_YIELD_PLANS = {
  wheat: {
    crop: 'Wheat (गेहूं / গম)',
    expectedYield: '48 - 55 Quintals / Acre (उच्च गुणवत्ता दाना)',
    timeline: [
      { stage: '1. भूमि तैयारी (Land Prep)', action: '2-3 बार गहरी जुताई करें और 4 टन गोबर की खाद मिलाएं।', fertilizer: 'Single Super Phosphate 100kg + MOP 30kg', tip: 'बीज बोने से पहले बीजोपचार अवश्य करें।' },
      { stage: '2. बुवाई (Sowing / 0-21 Days)', action: 'उचित नमी में 100-120 किग्रा बीज प्रति हेक्टेयर बोएं।', fertilizer: 'DAP 50kg + Urea 25kg', tip: 'लाइन से लाइन की दूरी 20 सेमी रखें।' },
      { stage: '3. सीआरआई अवस्था (Crown Root / 21-25 Days)', action: 'पहली सिंचाई सबसे महत्वपूर्ण है, ठीक समय पर दें।', fertilizer: 'Urea 45kg प्रति एकड़', tip: 'सिंचाई के तुरंत बाद खरपतवार नाशक न डालें।' },
      { stage: '4. कल्ले फूटना (Tillering / 40-45 Days)', action: 'दूसरी सिंचाई करें और खेत में खरपतवार नियंत्रण रखें।', fertilizer: 'Urea 30kg + Zinc Sulphate 5kg', tip: 'कन्नों की संख्या बढ़ाने के लिए सूक्ष्म पोषक तत्व दें।' },
      { stage: '5. बालियां निकलना (Heading / 70-80 Days)', action: 'तीसरी सिंचाई करें। तेज हवा चलने पर पानी न लगाएं।', fertilizer: '0:52:34 (NPK) 1kg पर्णीय छिड़काव', tip: 'दाने भरते समय पानी की कमी न होने दें।' },
      { stage: '6. कटाई (Harvesting / 120-135 Days)', action: 'दाने में 12-14% नमी रहने पर कटाई व गहाई करें।', fertilizer: 'कोई उर्वरक नहीं', tip: 'धूप में अच्छी तरह सुखाकर सुरक्षित भंडारण करें।' },
    ],
    generalTips: [
      'सिंचाई के समय तेज हवा हो तो पानी न दें, फसल गिरने (Lodging) का खतरा रहता है।',
      'यूरिया को 3 भागों में बांटकर दें ताकि नाइट्रोजन की बर्बादी न हो।',
      'गेहूं के साथ सरसों की अंतरवर्तीय खेती (Intercropping) से अतिरिक्त लाभ लें।',
    ],
  },
  rice: {
    crop: 'Paddy / Basmati Rice (धान / ধান)',
    expectedYield: '55 - 65 Quintals / Acre (बासमती: 40 - 45 क्विंटल)',
    timeline: [
      { stage: '1. नर्सरी तैयारी (Nursery / Day 0-25)', action: 'नर्सरी में 25-30 किग्रा प्रति हेक्टेयर बीज तैयार करें।', fertilizer: 'DAP 5kg + Zinc 1kg नर्सरी में', tip: 'ट्राइकोडर्मा से बीजोपचार करें।' },
      { stage: '2. रोपाई (Transplanting / Day 25-30)', action: '2-3 पौधे प्रति हिल, 20x15 सेमी दूरी पर लगाएं।', fertilizer: 'DAP 50kg + MOP 30kg + Urea 20kg', tip: 'खेत में 2-3 सेमी पानी हमेशा बनाए रखें।' },
      { stage: '3. प्रारंभिक बढ़वार (Tillering / Day 40-50)', action: 'खेत में खरपतवार निकालें और पहली टॉप ड्रेसिंग करें।', fertilizer: 'Urea 35kg + Zinc Sulphate 10kg', tip: 'तना छेदक कीट के लिए फेरोमोन ट्रैप लगाएं।' },
      { stage: '4. बालियां बनना (Panicle Initiation / Day 70)', action: 'खेत में पर्याप्त पानी रखें, 0:0:50 पोटाश स्प्रे करें।', fertilizer: 'Potassium Nitrate (13:0:45) 1.5kg/Acre', tip: 'हल्दी रोग से बचाव हेतु कॉपर का छिड़काव करें।' },
      { stage: '5. परिपक्वता व कटाई (Harvest / Day 115-130)', action: 'कटाई से 10 दिन पूर्व खेत का पानी निकाल दें।', fertilizer: 'कोई नहीं', tip: 'बालियां 85% पीली होने पर कटाई करें।' },
    ],
    generalTips: [
      'धान में जिंक की कमी (खैरा रोग) से बचाव के लिए रोपाई के 20 दिन बाद जिंक सल्फेट अवश्य दें।',
      'जल प्रबंधन (AWD Technique) अपनाकर 30% पानी की बचत करें।',
      'कीट निगरानी के लिए लाइट ट्रैप का प्रयोग करें।',
    ],
  },
  tomato: {
    crop: 'Tomato (टमाटर / টমেটো)',
    expectedYield: '250 - 320 Quintals / Acre',
    timeline: [
      { stage: '1. पौध रोपाई (Transplanting)', action: 'उठे हुए बेड्स (Raised Beds) पर ड्रिप और मल्चिंग के साथ लगाएं।', fertilizer: '19:19:19 NPK 5kg/Acre ड्रिप से', tip: 'शाम के समय ही रोपाई करें।' },
      { stage: '2. वानस्पतिक वृद्धि (Vegetative Stage)', action: 'पौधों को बांस और धागे से सहारा (Staking) दें।', fertilizer: '12:61:00 (Mono Ammonium Phosphate) 3kg', tip: 'निचली शाखाओं की छंटाई (Pruning) करें।' },
      { stage: '3. पुष्पन व फलन (Flowering & Fruiting)', action: 'कैल्शियम और बोरॉन का छिड़काव करें ताकि फल न फटें।', fertilizer: 'Calcium Nitrate + Boron 2g/L', tip: 'नियमित रूप से फूल गिरने से रोकने हेतु प्लानोफिक्स दें।' },
      { stage: '4. फल तुड़ाई (Harvesting)', action: 'हल्के लाल रंग (Breaker Stage) में तुड़ाई करें।', fertilizer: '0:0:50 Potassium Sulphate', tip: 'क्रेडिट रेट अच्छे मिलने पर बाजार भेजें।' },
    ],
    generalTips: [
      'मल्चिंग पेपर (25-30 माइक्रोन) लगाने से 50% पानी की बचत और खरपतवार से मुक्ति मिलती है।',
      'फल सड़न (Blossom End Rot) से बचने के लिए कैल्शियम की कमी न होने दें।',
      'पीले स्टिकी ट्रैप (Yellow Sticky Traps) से सफेद मक्खी का नियंत्रण करें।',
    ],
  },
};

/**
 * Soil Analysis Fallback Reports
 */
export const DEMO_SOIL_REPORTS = {
  satellite: {
    soilType: 'गांगेय जलोढ़ मिट्टी (Gangetic Alluvial Loam)',
    phLevel: '7.2 (तटस्थ / अत्यंत उपजाऊ)',
    organicCarbon: '0.62% (मध्यम से अच्छा)',
    moisture: '28% (फसल बुवाई हेतु आदर्श नमी)',
    deficiencies: ['जिंक (Zinc) की हल्की कमी', 'नाइट्रोजन (Nitrogen) मध्यम'],
    recommendations: [
      'बुवाई के समय 10 किग्रा जिंक सल्फेट प्रति एकड़ अवश्य मिलाएं।',
      'जैविक खाद (वर्मीकम्पोस्ट) 2 टन प्रति एकड़ डालें ताकि सूक्ष्म जीवाणुओं की संख्या बढ़े।',
      'यूरिया को दो से तीन चरणों में दें ताकि लीचिंग न हो।',
    ],
    suitableCrops: ['गेहूं (Wheat)', 'धान (Basmati Rice)', 'गन्ना (Sugarcane)', 'सरसों (Mustard)', 'मक्का (Maize)'],
  },
  vision: {
    soilType: 'काली कपास मिट्टी (Black Cotton Regur Soil)',
    phLevel: '7.8 (हल्की क्षारीय / उच्च नमी धारण क्षमता)',
    organicCarbon: '0.55% (मध्यम)',
    moisture: '32% (उच्च जल धारण)',
    deficiencies: ['फॉस्फोरस (Phosphorus) न्यून', 'आयरन (Iron) की उपलब्धता कम'],
    recommendations: [
      'सिंगल सुपर फॉस्फेट (SSP) का प्रयोग करें, जो फॉस्फोरस के साथ कैल्शियम व सल्फर भी देता है।',
      'खेत में गहरी दरारें पड़ने से पहले हल्की सिंचाई करें।',
      'जिप्सम का 100 किग्रा/एकड़ प्रयोग मिट्टी की संरचना सुधारता है।',
    ],
    suitableCrops: ['कपास (Cotton)', 'सोयाबीन (Soybean)', 'चना (Gram)', 'ज्वार (Sorghum)', 'प्याज (Onion)'],
  },
};

/**
 * AI Doctor QA Fallbacks
 */
export const DEMO_QA_RESPONSES = {
  yellow_rust: {
    text: 'गेहूं में पीला रतुआ (Yellow Rust) की रोकथाम के लिए प्रोपिकोनाज़ोल 25% EC (Tilt) 1 मिली प्रति लीटर या टेबुकोनाज़ोल 1 मिली/लीटर का छिड़काव तुरंत करें। रोग प्रभावित पत्तियों को न छुएं और मौसम साफ होने पर ही स्प्रे करें।',
    sourceUrls: [
      'https://icar.org.in/wheat-disease-management',
      'https://farmer.gov.in/cropguidelines.aspx',
    ],
  },
  fertilizer: {
    text: 'संतुलित पोषण के लिए मिट्टी परीक्षण के आधार पर N:P:K (4:2:1) का अनुपात रखें। रोपाई/बुवाई के समय DAP और पोटाश की पूरी मात्रा दें, जबकि यूरिया को 3 चरणों (CRI, टिलरिंग, बूटिंग) में विभाजित करके डालें।',
    sourceUrls: ['https://agricoop.nic.in/soil-health-card'],
  },
  default: {
    text: 'किसान भाई, आपकी समस्या के समाधान हेतु जैविक उपाय के रूप में 5% नीम का अर्क और रासायनिक नियंत्रण हेतु अनुशंसित फफूंदनाशक या कीटनाशक का सही मात्रा में छिड़काव करें। अधिक जानकारी हेतु अपने नजदीकी कृषि विज्ञान केंद्र (KVK) से संपर्क करें।',
    sourceUrls: ['https://farmer.gov.in'],
  },
};
