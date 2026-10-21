import { weeks, starterIdeas } from '../hub/curriculum.js';
console.log(`${weeks.length} modules ready. First: ${weeks[0].title}`);
console.log('Fictional starter ideas:\n' + starterIdeas.map(x=>'- '+x).join('\n'));
console.log('Run npm run dev, open the displayed URL, and save your first note.');
