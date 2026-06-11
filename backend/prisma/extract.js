const fs = require('fs');
const path = require('path');

try {
  const tsFilePath = path.join(__dirname, '../../frontend/src/constants/roadmapData.ts');
  let code = fs.readFileSync(tsFilePath, 'utf8');

  // Remove imports
  code = code.replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, '');

  // Remove typescript types/interfaces
  code = code.replace(/export\s+interface\s+\w+\s*\{[\s\S]*?\}/g, '');
  code = code.replace(/:\s*(QuizQuestion|LearningSlide|ModuleData)\[?\]?/g, '');
  code = code.replace(/as\s+const/g, '');
  
  // Remove all export keywords
  code = code.replace(/\bexport\s+/g, '');

  // Keep staticModules array definition and export it
  code = code + '\nmodule.exports = { staticModules };';

  // Run the code by evaluating it
  const moduleObj = { exports: {} };
  const fn = new Function('module', 'exports', 'require', code);
  fn(moduleObj, moduleObj.exports, require);

  const staticModules = moduleObj.exports.staticModules;
  if (!staticModules || !Array.isArray(staticModules)) {
    throw new Error('staticModules array could not be extracted');
  }

  console.log(`Successfully extracted ${staticModules.length} modules!`);
  
  // Write to modules.json
  const outputFilePath = path.join(__dirname, 'modules.json');
  fs.writeFileSync(outputFilePath, JSON.stringify(staticModules, null, 2));
  console.log(`Saved seed JSON to ${outputFilePath}`);
} catch (err) {
  console.error('Extraction failed:', err.message);
  process.exit(1);
}
