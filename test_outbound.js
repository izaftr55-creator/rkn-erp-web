const masterHarga = {
    "HITAM 15X25": 1700000, "HITAM 17X30": 1520000, "HITAM 20X30": 1760000, "HITAM 25X35": 1350000,
    "PINK 15X25": 1850000, "KUNING 15X25": 1850000, "ORANGE 15X25": 1850000, "BIRU 15X25": 1850000,
    "HIJAU 15X25": 1850000, "UNGU 15X25": 1850000, "TOSCA 15X25": 1850000, "PINK 17X30": 1520000,
    "KUNING 17X30": 1520000, "ORANGE 17X30": 1520000, "BIRU 17X30": 1520000, "HIJAU 17X30": 1520000,
    "UNGU 17X30": 1520000, "TOSCA 17X30": 1520000, "PINK 20X30": 1760000, "KUNING 20X30": 1760000,
    "ORANGE 20X30": 1760000, "BIRU 20X30": 1760000, "HIJAU 20X30": 1760000, "UNGU 20X30": 1760000,
    "TOSCA 20X30": 1760000, "PINK 25X35": 1350000, "KUNING 25X35": 1350000, "ORANGE 25X35": 1350000,
    "BIRU 25X35": 1350000, "HIJAU 25X35": 1350000, "UNGU 25X35": 1350000, "TOSCA 25X35": 1350000,
    "PUTIH A 15X25": 1850000, "PUTIH A 17X30": 1880000, "PUTIH A 20X30": 2080000, "PUTIH A 25X35": 2000000,
    "PUTIH B 15X25": 1050000, "PUTIH B 17X30": 1150000, "PUTIH B 20X30": 1200000, "PUTIH B 25X35": 1050000,
};

let variantName = "POLYMAILER PUTIH B 20X30";
// Exact match logic
let matchedKey = null;
for (let key of Object.keys(masterHarga)) {
    // Replace " BALL" if exists
    let cleanKey = key.replace(" BALL", "");
    // Check if variantName contains color and size exactly.
    // Let's use Regex or exact string match
    // E.g. "PUTIH A" vs "PUTIH B"
    let parts = cleanKey.split(" ");
    let match = true;
    for (let part of parts) {
        if (!new RegExp("\\b" + part + "\\b").test(variantName)) {
            match = false; break;
        }
    }
    if (match) {
        matchedKey = cleanKey;
        break;
    }
}
console.log(matchedKey);
