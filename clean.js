const fs = require('fs');
let lines = fs.readFileSync('cloudflare/plasticTradingV2.ts', 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes('/* RKN_PLASTIC_EMERGENCY_RECOVERY_PHASE_2 */'));
if (startIdx !== -1) {
    let endIdx = -1;
    for(let i=startIdx; i<lines.length; i++) {
        if(lines[i].includes('} catch(e) {}')) {
            endIdx = i;
            break;
        }
    }
    if (endIdx !== -1) {
        lines.splice(startIdx, (endIdx + 1) - startIdx);
        fs.writeFileSync('cloudflare/plasticTradingV2.ts', lines.join('\n'));
        console.log('Cleaned successfully! Removed ' + ((endIdx + 1) - startIdx) + ' lines.');
    }
}
