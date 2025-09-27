document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const maleBody = document.getElementById('maleBody');
  const femaleBody = document.getElementById('femaleBody');
  const showMaleBtn = document.getElementById('showMaleBtn');
  const showFemaleBtn = document.getElementById('showFemaleBtn');
  const qaModal = document.getElementById('qaModal');
  const closeModalBtn = qaModal.querySelector('.close-btn');
  const questionTextEl = document.getElementById('questionText');
  const answerOptionsEl = document.getElementById('answerOptions');
  const modalTitleEl = document.getElementById('modalTitle');
  const resultTextEl = document.getElementById('resultText');
  const resultAreaEl = document.getElementById('resultArea');

  let currentBodyPartName = ''; // Keep track of the clicked part name

  // --- Data: Question Tree ---
  // This is the core logic. Each key is a question ID.
  // 'question': The text displayed.
  // 'answers': An object where keys are button text and values are:
  //      - The ID of the next question (string).
  //      - An object { diagnosis: "..." } for the final result.
  const diagnosisTree = {
    // Entry points linked from body parts
    'head_start': {
      question: "What issue are you experiencing with your head?",
      answers: {
        "Headache": "head_q_headache_type",
        "Dizziness": "head_q_dizziness_freq",
        "Vision Problem": "head_q_vision_desc",
        "Scalp Issue (itch/rash)": { diagnosis: "Possible dermatitis or infection. Consider over-the-counter treatments or see a dermatologist if severe/persistent." },
        "Other": { diagnosis: "Head symptoms can be complex. Please consult a healthcare professional for a proper diagnosis." }
      }
    },
    'head_q_headache_type': {
      question: "What type of headache is it?",
      answers: {
        "Sharp/Stabbing": { diagnosis: "Could indicate cluster headaches or neuralgia. Urgent medical evaluation is recommended if severe or new." },
        "Dull/Aching/Pressure": "head_q_headache_location",
        "Throbbing/Pulsating": "head_q_headache_side",
        "Comes with Nausea/Light Sensitivity": { diagnosis: "Sounds like a potential migraine. Rest in a dark, quiet room. See a doctor for diagnosis and management options." }
      }
    },
    'head_q_headache_location': {
      question: "Where is the dull headache located?",
      answers: {
        "All over / Band-like": { diagnosis: "Likely a tension headache. Check stress levels, posture, hydration, and consider over-the-counter pain relief." },
        "Forehead / Temples": { diagnosis: "Common with tension headaches or potentially sinus issues (if accompanied by congestion)." },
        "Back of head / Neck": { diagnosis: "Could be cervicogenic (neck-related) or tension headache. Check posture and neck strain." }
      }
    },
    'head_q_headache_side': {
      question: "Is the throbbing headache usually on one side?",
      answers: {
        "Yes, usually one side": { diagnosis: "Strongly suggests migraine. Monitor symptoms (aura, nausea) and consult a doctor." },
        "No, it varies or is all over": { diagnosis: "Could still be migraine or other types. Monitor frequency and triggers. Consult a doctor." }
      }
    },
    'head_q_dizziness_freq': {
      question: "How often do you feel dizzy?",
      answers: {
        "Constantly": { diagnosis: "Persistent dizziness needs medical evaluation to rule out inner ear issues, neurological problems, or cardiovascular causes." },
        "Occasionally / Specific Triggers": "head_q_dizziness_type",
        "Only when Standing Up Quickly": { diagnosis: "Could be orthostatic hypotension (temporary blood pressure drop). Stay hydrated. Consult a doctor if frequent or severe." }
      }
    },
    'head_q_dizziness_type': {
      question: "What does the dizziness feel like?",
      answers: {
        "Room Spinning (Vertigo)": { diagnosis: "Suggests inner ear issues (like BPPV or Meniere's disease). See a doctor, possibly an ENT specialist." },
        "Lightheadedness / Faintness": { diagnosis: "Could be related to blood pressure, hydration, anxiety, or blood sugar. Monitor and consult a doctor." },
        "Unsteadiness / Off-balance": { diagnosis: "May relate to neurological or inner ear problems. Medical evaluation is recommended." }
      }
    },
    'head_q_vision_desc': {
      question: "Describe the vision problem.",
      answers: {
        "Blurry Vision": { diagnosis: "Needs an eye exam. Could be refractive error (needing glasses), dry eye, cataracts, or other eye conditions." },
        "Double Vision": { diagnosis: "Requires prompt medical attention to rule out neurological or eye muscle issues." },
        "Flashes or Floaters (New/Sudden)": { diagnosis: "Urgent eye evaluation needed to rule out retinal detachment or tear." },
        "Loss of Vision": { diagnosis: "Emergency. Seek immediate medical attention." }
      }
    },

    // --- Neck ---
    'neck_start': {
      question: "What's the main issue with your neck?",
      answers: {
        "Pain / Stiffness": "neck_q_pain_type",
        "Limited Movement": "neck_q_movement",
        "Lump or Swelling": { diagnosis: "Any new lump or persistent swelling in the neck needs evaluation by a doctor to check lymph nodes or thyroid." },
        "Pain Radiating to Arm": { diagnosis: "Could indicate a pinched nerve (cervical radiculopathy). See a doctor for assessment." }
      }
    },
    'neck_q_pain_type': {
      question: "What is the neck pain like?",
      answers: {
        "Dull Ache / Tightness": { diagnosis: "Often muscular strain or poor posture. Gentle stretches, heat/cold packs, and posture correction may help. See a doctor if persistent." },
        "Sharp / Specific Point": { diagnosis: "Could be a joint issue or muscle spasm. See a doctor if severe or doesn't improve." },
        "Worse with Movement": "neck_q_movement"
      }
    },
    'neck_q_movement': {
      question: "Is your range of motion significantly limited?",
      answers: {
        "Yes, very difficult to turn/tilt head": { diagnosis: "Could be significant muscle spasm (torticollis) or underlying joint issue. Medical evaluation recommended." },
        "Slightly stiff, but can move": { diagnosis: "Likely muscular. Try gentle stretches. If pain is severe or persists, see a doctor." }
      }
    },

    // --- Torso/Chest/Abdomen --- (Using general 'torso' for simplicity, refine SVG and logic for chest/abdomen separation)
    'torso_start': {
      question: "What issue are you experiencing in your torso (chest or abdomen)?",
      answers: {
        "Chest Pain": "chest_q_pain_location",
        "Abdominal Pain": "abdomen_q_pain_location",
        "Shortness of Breath": "chest_q_sob_trigger",
        "Cough": "chest_q_cough_type",
        "Heartburn / Indigestion": { diagnosis: "Common issue. Try dietary changes or over-the-counter antacids. See a doctor if severe, frequent, or accompanied by other symptoms like weight loss or difficulty swallowing." },
        "Bloating / Gas": { diagnosis: "Often related to diet. Monitor trigger foods. If persistent or painful, consult a doctor." }
      }
    },
    // Chest specific path
    'chest_q_pain_location': {
      question: "Where exactly is the chest pain?",
      answers: {
        "Center / Left side, pressure/squeezing": { diagnosis: "Potentially heart-related. Seek IMMEDIATE medical attention (call emergency services)." },
        "Sharp, worse with breathing/coughing": { diagnosis: "Could be lung-related (pleurisy) or musculoskeletal. See a doctor, urgently if breathing is difficult." },
        "Burning, behind breastbone": { diagnosis: "Likely heartburn/acid reflux. See 'Heartburn' suggestion. If severe or unsure, see a doctor." },
        "Localized, tender to touch": { diagnosis: "Probably musculoskeletal (muscle strain, costochondritis). Rest, OTC pain relief. See doctor if persists." }
      }
    },
    'chest_q_sob_trigger': {
      question: "When do you experience shortness of breath?",
      answers: {
        "During exertion/activity": { diagnosis: "Could be lung or heart-related, or deconditioning. Needs medical evaluation." },
        "At rest / Suddenly": { diagnosis: "Potentially serious (e.g., pulmonary embolism, severe asthma attack, heart failure). Seek IMMEDIATE medical attention." },
        "With wheezing": { diagnosis: "Suggests asthma or COPD. Requires medical diagnosis and management." },
        "With cough and fever": { diagnosis: "Possible respiratory infection (like pneumonia or bronchitis). See a doctor." }
      }
    },
    'chest_q_cough_type': {
      question: "What is the cough like?",
      answers: {
        "Dry / Tickly": { diagnosis: "Could be allergies, viral infection, or irritation. If persistent, see a doctor." },
        "Productive (with phlegm)": "chest_q_cough_phlegm",
        "Barking / Croupy (esp. child)": { diagnosis: "Suggests croup. Needs medical evaluation, urgently if breathing is difficult." },
        "Whooping sound after coughing": { diagnosis: "Possible pertussis (whooping cough). See a doctor." }
      }
    },
    'chest_q_cough_phlegm': {
      question: "What color is the phlegm?",
      answers: {
        "Clear / White": { diagnosis: "Often viral bronchitis or allergies." },
        "Yellow / Green": { diagnosis: "May indicate bacterial infection (like bronchitis or pneumonia). See a doctor." },
        "Pink / Bloody": { diagnosis: "Requires prompt medical evaluation to rule out serious lung or heart issues." }
      }
    },
    // Abdomen specific path
    'abdomen_q_pain_location': {
      question: "Where in the abdomen is the pain primarily located?",
      answers: {
        "Upper Right (under ribs)": { diagnosis: "Could be gallbladder issues (stones, inflammation). See a doctor, urgently if severe pain, fever, or jaundice." },
        "Upper Middle (below sternum)": { diagnosis: "Often stomach-related (gastritis, ulcer, indigestion). See 'Heartburn' suggestion or consult doctor if severe/persistent." },
        "Upper Left (under ribs)": { diagnosis: "Less common, could be stomach, spleen, or pancreas related. Consult a doctor." },
        "Lower Right": { diagnosis: "Classic area for appendicitis. Seek IMMEDIATE medical attention if pain is severe, worsening, or with fever/nausea." },
        "Lower Left": { diagnosis: "Common site for diverticulitis pain. Also possible constipation or ovarian issues (female). Consult a doctor." },
        "Generalized / All over": { diagnosis: "Could be gas, indigestion, viral gastroenteritis, or other issues. Monitor symptoms. See doctor if severe or persistent." },
        "Lower Middle (above pubic bone)": { diagnosis: "Could be bladder infection (UTI), pelvic inflammatory disease (female), or other pelvic issues. Consult a doctor." }
      }
    },

    // --- Arms --- (Simplified - Left/Right combined)
    'arm_start': {
      question: "What issue are you having with your arm?",
      answers: {
        "Pain": "arm_q_pain_type",
        "Weakness / Numbness / Tingling": { diagnosis: "Could indicate nerve issues (pinched nerve in neck/shoulder, carpal tunnel in wrist) or circulation problems. Needs medical evaluation." },
        "Swelling": "arm_q_swelling",
        "Limited Movement / Stiffness (Shoulder/Elbow/Wrist)": { diagnosis: "Possible joint inflammation (arthritis), tendonitis, or injury. Rest, ice, and see a doctor if no improvement." }
      }
    },
    'arm_q_pain_type': {
      question: "What is the arm pain like?",
      answers: {
        "Aching / Soreness (Muscle)": { diagnosis: "Likely muscle strain or overuse. Rest, ice/heat, gentle stretching may help." },
        "Sharp / Shooting (esp. with movement)": { diagnosis: "Could be tendonitis, joint issue, or nerve irritation. Consult a doctor." },
        "Pain in Joint (Shoulder/Elbow/Wrist)": { diagnosis: "Suggests arthritis, bursitis, or tendonitis. See doctor for diagnosis." }
      }
    },
    'arm_q_swelling': {
      question: "Is the swelling localized or throughout the arm?",
      answers: {
        "Localized (e.g., around a joint)": { diagnosis: "Suggests injury, inflammation (bursitis, arthritis), or infection. See a doctor." },
        "Whole arm swelling": { diagnosis: "Could be circulation issue (blood clot - DVT, although less common in arm than leg) or lymphatic blockage. Needs prompt medical evaluation." }
      }
    },

    // --- Legs --- (Simplified - Left/Right combined)
    'leg_start': {
      question: "What issue are you having with your leg?",
      answers: {
        "Pain": "leg_q_pain_location",
        "Weakness / Numbness / Tingling": { diagnosis: "Could indicate nerve issues (sciatica from back, peripheral neuropathy) or circulation problems. Needs medical evaluation." },
        "Swelling": "leg_q_swelling",
        "Limited Movement / Stiffness (Hip/Knee/Ankle)": { diagnosis: "Possible joint inflammation (arthritis), tendonitis, or injury. Rest, ice, and see a doctor if no improvement." },
        "Cramps": { diagnosis: "Often dehydration or electrolyte imbalance. If frequent or severe, check medication side effects or see a doctor." }
      }
    },
    'leg_q_pain_location': {
      question: "Where is the leg pain located?",
      answers: {
        "Back of thigh/calf (Sciatica-like)": { diagnosis: "Often originates from lower back (pinched nerve). See a doctor for assessment." },
        "Calf (esp. with swelling/redness)": { diagnosis: "Possible Deep Vein Thrombosis (DVT - blood clot). Seek IMMEDIATE medical attention." },
        "Shin (Shin Splints)": { diagnosis: "Common with overuse/running. Rest, ice, proper footwear. See doctor if severe or persistent." },
        "Joint (Hip/Knee/Ankle)": { diagnosis: "Suggests arthritis, bursitis, tendonitis, or injury. See doctor for diagnosis." },
        "Generalized Muscle Aches": { diagnosis: "Could be overuse, viral illness, or dehydration." }
      }
    },
    'leg_q_swelling': {
      question: "Is the swelling in one leg or both?",
      answers: {
        "One leg (esp. with pain/redness)": { diagnosis: "Concerning for DVT (blood clot) or infection (cellulitis). Seek IMMEDIATE medical attention." },
        "Both legs": { diagnosis: "Often related to fluid retention (heart failure, kidney problems, liver issues, medication side effect) or venous insufficiency. Needs medical evaluation." }
      }
    },

    // Default / Fallback
    'general_fallback': {
      diagnosis: "Symptoms described are complex or non-specific. It's best to consult a healthcare professional for an accurate diagnosis."
    }
  };

  // Maps SVG element ID prefixes to starting question nodes
  const partToQuestionMap = {
    'head': 'head_start',
    'neck': 'neck_start',
    'torso': 'torso_start', // Use this general one if chest/abdomen aren't separate clicks
    'chest': 'chest_q_pain_location', // Example if chest *is* clickable separately
    'abdomen': 'abdomen_q_pain_location', // Example if abdomen *is* clickable separately
    'arm-left': 'arm_start',
    'arm-right': 'arm_start',
    'leg-left': 'leg_start',
    'leg-right': 'leg_start'
    // Add more mappings as needed
  };


  // --- Event Listeners ---

  // Body switcher
  showMaleBtn.addEventListener('click', () => switchBody('male'));
  showFemaleBtn.addEventListener('click', () => switchBody('female'));

  // Clicking on body parts (Event Delegation on containers)
  maleBody.addEventListener('click', handleBodyPartClick);
  femaleBody.addEventListener('click', handleBodyPartClick);

  // Closing the modal
  closeModalBtn.addEventListener('click', closeModal);
  qaModal.addEventListener('click', (event) => {
    // Close if clicked on the background overlay
    if (event.target === qaModal) {
      closeModal();
    }
  });

  // Handling clicks on answer buttons (Event Delegation on answer container)
  answerOptionsEl.addEventListener('click', handleAnswerClick);


  // --- Functions ---

  function switchBody(bodyType) {
    if (bodyType === 'male') {
      maleBody.classList.add('visible');
      femaleBody.classList.remove('visible');
      showMaleBtn.classList.add('active');
      showFemaleBtn.classList.remove('active');
    } else {
      femaleBody.classList.add('visible');
      maleBody.classList.remove('visible');
      showFemaleBtn.classList.add('active');
      showMaleBtn.classList.remove('active');
    }
    // Reset result text when switching bodies
    resultTextEl.textContent = 'Click on a body part to start.';
    resultTextEl.style.fontWeight = 'normal';
    resultTextEl.style.color = '#555';
  }

  function handleBodyPartClick(event) {
    const clickedPart = event.target.closest('.body-part'); // Find the closest parent with class 'body-part'
    if (!clickedPart) return; // Exit if click wasn't on a designated part

    const partId = clickedPart.id; // e.g., "male-head" or "female-arm-left"
    currentBodyPartName = clickedPart.dataset.partName || 'Selected Area'; // Get readable name

    // Determine the base part name (e.g., 'head' from 'male-head')
    let basePartId = partId.replace('male-', '').replace('female-', '');

    // Find the starting question ID from the map
    const startQuestionId = partToQuestionMap[basePartId];

    if (startQuestionId && diagnosisTree[startQuestionId]) {
      resultTextEl.textContent = 'Follow the questions in the pop-up...'; // Update result area placeholder
      resultTextEl.style.fontWeight = 'normal';
      resultTextEl.style.color = '#555';
      askQuestion(startQuestionId);
      modalTitleEl.textContent = `Regarding your ${currentBodyPartName}`;
      qaModal.style.display = 'block';
    } else {
      console.warn(`No question mapping found for part ID: ${partId} (base: ${basePartId})`);
      resultTextEl.textContent = `No specific questions available for ${currentBodyPartName} yet.`;
      resultTextEl.style.fontWeight = 'bold';
      resultTextEl.style.color = '#cc0000'; // Indicate an issue/missing path
    }
  }

  function askQuestion(questionId) {
    const node = diagnosisTree[questionId];
    if (!node || !node.question) {
      console.error(`Invalid questionId or node structure: ${questionId}`);
      showDiagnosis({ diagnosis: "An error occurred in the question flow. Please consult a doctor." });
      return;
    }

    questionTextEl.textContent = node.question;
    answerOptionsEl.innerHTML = ''; // Clear previous options

    // Create buttons for each answer
    for (const answerText in node.answers) {
      const button = document.createElement('button');
      button.textContent = answerText;
      // Store the next step (either next question ID or diagnosis object) in a data attribute
      button.dataset.next = JSON.stringify(node.answers[answerText]);
      answerOptionsEl.appendChild(button);
    }
  }

  function handleAnswerClick(event) {
    if (event.target.tagName !== 'BUTTON') return; // Only process button clicks

    const nextStepData = JSON.parse(event.target.dataset.next);

    if (typeof nextStepData === 'string') {
      // It's an ID for the next question
      askQuestion(nextStepData);
    } else if (typeof nextStepData === 'object' && nextStepData.diagnosis) {
      // It's a diagnosis object
      showDiagnosis(nextStepData);
    } else {
      console.error('Invalid next step data:', nextStepData);
      showDiagnosis({ diagnosis: "Error processing answer. Please consult a doctor." });
    }
  }


  function showDiagnosis(diagnosisData) {
    resultTextEl.textContent = diagnosisData.diagnosis;
    resultTextEl.style.fontWeight = 'bold'; // Make diagnosis stand out
    resultTextEl.style.color = '#0056b3'; // Use a distinct color for diagnosis
    closeModal();
  }

  function closeModal() {
    // Add fade-out animation class
    qaModal.classList.add('fade-out');

    // Wait for animation to finish before hiding
    setTimeout(() => {
      qaModal.style.display = 'none';
      qaModal.classList.remove('fade-out'); // Remove class for next time
      // Optional: Clear modal content when closed
      questionTextEl.textContent = '';
      answerOptionsEl.innerHTML = '';
      modalTitleEl.textContent = 'Question';
    }, 300); // Match timeout to CSS animation duration
  }

  // --- Initial Setup ---
  switchBody('male'); // Start with the male body visible

}); // End DOMContentLoaded
