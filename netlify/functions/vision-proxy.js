const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Debug: Log all environment variables (safely)
  console.log('Environment variables:', Object.keys(process.env).sort());
  console.log('GOOGLE_APPLICATION_CREDENTIALS exists:', 'GOOGLE_APPLICATION_CREDENTIALS' in process.env);
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Discipline-specific keyword lists for result prioritization
  const DISCIPLINE_KEYWORDS = {
    culinary: ['food', 'ingredient', 'vegetable', 'fruit', 'meat', 'spice', 'herb', 'sauce', 'dairy', 'grain', 'seafood', 'poultry', 'bread', 'cheese', 'oil', 'vinegar', 'flour', 'sugar', 'salt', 'pepper', 'onion', 'garlic', 'tomato', 'potato', 'carrot', 'lettuce', 'mushroom', 'lemon', 'lime', 'butter', 'egg', 'milk', 'cream', 'pasta', 'rice', 'bean', 'nut', 'seed', 'chocolate', 'vanilla'],
    plumbing: ['pipe', 'fitting', 'valve', 'faucet', 'fixture', 'copper', 'pvc', 'drain', 'supply', 'pressure', 'coupling', 'elbow', 'tee', 'reducer', 'union', 'flange', 'gasket', 'solder', 'flux', 'thread', 'wrench', 'cutter', 'auger', 'sealant', 'teflon', 'toilet', 'sink', 'shower', 'pump', 'water heater'],
    automotive: ['engine', 'brake', 'tire', 'wheel', 'battery', 'filter', 'fluid', 'belt', 'hose', 'sensor', 'alternator', 'starter', 'radiator', 'exhaust', 'transmission', 'clutch', 'spark plug', 'fuel', 'oil', 'coolant', 'caliper', 'rotor', 'pad', 'strut', 'shock', 'cv joint', 'axle', 'bearing', 'gasket', 'timing'],
    construction: ['lumber', 'wood', 'concrete', 'brick', 'block', 'rebar', 'nail', 'screw', 'bolt', 'joist', 'stud', 'beam', 'plywood', 'drywall', 'insulation', 'sheathing', 'framing', 'footing', 'foundation', 'hardware', 'anchor', 'strap', 'bracket', 'level', 'saw', 'drill', 'hammer', 'scaffold', 'safety', 'helmet', 'vest'],
    electrical: ['wire', 'cable', 'conduit', 'outlet', 'switch', 'breaker', 'panel', 'circuit', 'junction', 'connector', 'terminal', 'voltage', 'ampere', 'ground', 'neutral', 'hot', 'romex', 'emt', 'pvc', 'raceway', 'stranded', 'solid', 'gauge', 'relay', 'fuse', 'transformer', 'capacitor', 'resistor', 'meter', 'multimeter'],
    hvac: ['duct', 'vent', 'register', 'diffuser', 'damper', 'filter', 'coil', 'compressor', 'condenser', 'evaporator', 'refrigerant', 'thermostat', 'blower', 'furnace', 'heat pump', 'air handler', 'insulation', 'flue', 'drain pan', 'linesets', 'freon', 'tonnage', 'seer', 'ahu', 'vav', 'plenum', 'balancing', 'static pressure', 'cfm'],
    manufacturing: ['fastener', 'bolt', 'nut', 'screw', 'washer', 'rivet', 'bearing', 'shaft', 'gear', 'sprocket', 'chain', 'bushing', 'seal', 'gasket', 'bracket', 'plate', 'stock', 'raw material', 'casting', 'forging', 'machined', 'tolerance', 'drill bit', 'end mill', 'insert', 'coolant', 'lubricant', 'fixture', 'jig', 'gauge'],
    logistics: ['pallet', 'crate', 'drum', 'container', 'box', 'carton', 'package', 'freight', 'cargo', 'truck', 'trailer', 'forklift', 'dock', 'warehouse', 'shrink wrap', 'strapping', 'label', 'barcode', 'shipping', 'skid', 'tote', 'bin', 'rack', 'lading', 'manifest', 'inventory', 'sku', 'weight', 'dimension'],
    machining: ['electrode', 'rod', 'wire feed', 'flux', 'slag', 'weld', 'bead', 'joint', 'metal', 'steel', 'aluminum', 'stainless', 'iron', 'alloy', 'grinder', 'angle grinder', 'mask', 'helmet', 'glove', 'clamp', 'magnet', 'square', 'wire brush', 'nozzle', 'tip', 'shielding gas', 'argon', 'co2', 'mig', 'tig', 'stick', 'plasma', 'torch'],
  };

  try {
    const { base64Image, discipline } = JSON.parse(event.body);
    
    if (!base64Image) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing image data' })
      };
    }

    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    console.log('API key found:', !!apiKey);
    
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Server configuration error',
          debug: {
            availableVars: Object.keys(process.env).filter(k => k.includes('GOOGLE') || k.includes('KEY'))
          }
        })
      };
    }

    const body = {
      requests: [{
        image: { content: base64Image },
        features: [
          { type: 'TEXT_DETECTION', maxResults: 1 },
          { type: 'LABEL_DETECTION', maxResults: 20, model: 'builtin/latest' },
          { type: 'OBJECT_LOCALIZATION', maxResults: 15 }
        ],
        imageContext: {
          languageHints: ['en']
        }
      }]
    };

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Vision API error:', error);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Vision API error: ${error}` })
      };
    }

    const data = await response.json();
    
    // Base detection
    const text = data?.responses?.[0]?.fullTextAnnotation?.text || '';
    const textLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    
    // Process object localization results - these are the most specific
    const objects = data?.responses?.[0]?.localizedObjectAnnotations
      ?.filter(obj => obj.score > 0.5) // Lowered confidence threshold
      ?.map(obj => obj.name) || [];
    
    // Process labels with adjusted confidence threshold
    const labels = data?.responses?.[0]?.labelAnnotations
      ?.filter(label => label.score > 0.7) // Lowered confidence threshold
      ?.map(label => label.description) || [];
    
    // Combine text, labels, and objects
    const allRawResults = [...textLines, ...labels, ...objects];
    
    // Filter out generic terms but keep logistics-relevant items
    const genericTerms = ['product', 'item', 'object', 'substance', 'element', 'close up', 'photography', 'table', 'person', 'human', 'man', 'woman', 'building', 'sky', 'ground', 'floor', 'wall', 'room', 'indoor', 'outdoor'];
    const specificResults = allRawResults.filter(item => {
      const text = item.toLowerCase();
      // Only filter if the term is exactly generic or part of a longer phrase
      return !genericTerms.some(term => 
        text === term || 
        new RegExp(`\\b${term}\\b`).test(text)
      );
    });
    
    // Start with basic results
    let results = Array.from(new Set(specificResults));
    
    // Discipline-aware sorting: relevant terms bubble to the top, everything else still included
    if (results.length > 0 && discipline && DISCIPLINE_KEYWORDS[discipline]) {
      try {
        const keywords = DISCIPLINE_KEYWORDS[discipline];
        const relevant = results.filter(item =>
          keywords.some(kw => item.toLowerCase().includes(kw))
        );
        const rest = results.filter(item =>
          !keywords.some(kw => item.toLowerCase().includes(kw))
        );
        results = Array.from(new Set([...relevant, ...rest]));
      } catch (sortError) {
        console.error('Discipline sort failed:', sortError);
        // Continue with unsorted results
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ results })
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
