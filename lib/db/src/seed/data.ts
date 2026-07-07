// Tamil Nadu master data for CorruptionFreeTN.
// This file is the single source of truth consumed by the re-runnable seed
// script (src/seed/index.ts). Generated from official TN administrative data.

export interface DistrictSeed { name: string; nameTa: string; code: string; }
export interface TalukSeed { district: string; name: string; nameTa: string | null; }
export interface MinistrySeed { name: string; nameTa: string | null; ministerName: string | null; }
export interface DepartmentSeed { ministry: string | null; name: string; nameTa: string | null; description: string | null; }
export interface CategorySeed { name: string; nameTa: string | null; description: string | null; }
export interface RoleSeed { name: string; nameTa: string | null; description: string | null; }

export const districtSeeds: DistrictSeed[] = [
  {
    "name": "Ariyalur",
    "nameTa": "அரியலூர்",
    "code": "ARI"
  },
  {
    "name": "Chengalpattu",
    "nameTa": "செங்கல்பட்டு",
    "code": "CGL"
  },
  {
    "name": "Chennai",
    "nameTa": "சென்னை",
    "code": "CHE"
  },
  {
    "name": "Coimbatore",
    "nameTa": "கோயம்புத்தூர்",
    "code": "CBE"
  },
  {
    "name": "Cuddalore",
    "nameTa": "கடலூர்",
    "code": "CUD"
  },
  {
    "name": "Dharmapuri",
    "nameTa": "தர்மபுரி",
    "code": "DPI"
  },
  {
    "name": "Dindigul",
    "nameTa": "திண்டுக்கல்",
    "code": "DGL"
  },
  {
    "name": "Erode",
    "nameTa": "ஈரோடு",
    "code": "ERD"
  },
  {
    "name": "Kallakurichi",
    "nameTa": "கள்ளக்குறிச்சி",
    "code": "KLK"
  },
  {
    "name": "Kancheepuram",
    "nameTa": "காஞ்சிபுரம்",
    "code": "KPM"
  },
  {
    "name": "Kanniyakumari",
    "nameTa": "கன்னியாகுமரி",
    "code": "KKI"
  },
  {
    "name": "Karur",
    "nameTa": "கரூர்",
    "code": "KAR"
  },
  {
    "name": "Krishnagiri",
    "nameTa": "கிருஷ்ணகிரி",
    "code": "KGI"
  },
  {
    "name": "Madurai",
    "nameTa": "மதுரை",
    "code": "MDU"
  },
  {
    "name": "Mayiladuthurai",
    "nameTa": "மயிலாடுதுறை",
    "code": "MYL"
  },
  {
    "name": "Nagapattinam",
    "nameTa": "நாகப்பட்டினம்",
    "code": "NAG"
  },
  {
    "name": "Namakkal",
    "nameTa": "நாமக்கல்",
    "code": "NMK"
  },
  {
    "name": "Nilgiris",
    "nameTa": "நீலகிரி",
    "code": "NIL"
  },
  {
    "name": "Perambalur",
    "nameTa": "பெரம்பலூர்",
    "code": "PER"
  },
  {
    "name": "Pudukkottai",
    "nameTa": "புதுக்கோட்டை",
    "code": "PDK"
  },
  {
    "name": "Ramanathapuram",
    "nameTa": "ராமநாதபுரம்",
    "code": "RMD"
  },
  {
    "name": "Ranipet",
    "nameTa": "ராணிப்பேட்டை",
    "code": "RPT"
  },
  {
    "name": "Salem",
    "nameTa": "சேலம்",
    "code": "SLM"
  },
  {
    "name": "Sivaganga",
    "nameTa": "சிவகங்கை",
    "code": "SVG"
  },
  {
    "name": "Tenkasi",
    "nameTa": "தென்காசி",
    "code": "TEN"
  },
  {
    "name": "Thanjavur",
    "nameTa": "தஞ்சாவூர்",
    "code": "TNJ"
  },
  {
    "name": "Theni",
    "nameTa": "தேனி",
    "code": "TNI"
  },
  {
    "name": "Thoothukudi",
    "nameTa": "தூத்துக்குடி",
    "code": "TUT"
  },
  {
    "name": "Tiruchirappalli",
    "nameTa": "திருச்சிராப்பள்ளி",
    "code": "TRY"
  },
  {
    "name": "Tirunelveli",
    "nameTa": "திருநெல்வேலி",
    "code": "TVL"
  },
  {
    "name": "Tirupathur",
    "nameTa": "திருப்பத்தூர்",
    "code": "TPT"
  },
  {
    "name": "Tiruppur",
    "nameTa": "திருப்பூர்",
    "code": "TUP"
  },
  {
    "name": "Tiruvallur",
    "nameTa": "திருவள்ளூர்",
    "code": "TLR"
  },
  {
    "name": "Tiruvannamalai",
    "nameTa": "திருவண்ணாமலை",
    "code": "TVM"
  },
  {
    "name": "Tiruvarur",
    "nameTa": "திருவாரூர்",
    "code": "TVR"
  },
  {
    "name": "Vellore",
    "nameTa": "வேலூர்",
    "code": "VLR"
  },
  {
    "name": "Viluppuram",
    "nameTa": "விழுப்புரம்",
    "code": "VPM"
  },
  {
    "name": "Virudhunagar",
    "nameTa": "விருதுநகர்",
    "code": "VNR"
  }
];

export const talukSeeds: TalukSeed[] = [
  {
    "district": "Ariyalur",
    "name": "Ariyalur",
    "nameTa": null
  },
  {
    "district": "Ariyalur",
    "name": "Sendurai",
    "nameTa": null
  },
  {
    "district": "Ariyalur",
    "name": "Udayarpalayam",
    "nameTa": null
  },
  {
    "district": "Ariyalur",
    "name": "Andimadam",
    "nameTa": null
  },
  {
    "district": "Chengalpattu",
    "name": "Chengalpattu",
    "nameTa": null
  },
  {
    "district": "Chengalpattu",
    "name": "Tambaram",
    "nameTa": null
  },
  {
    "district": "Chengalpattu",
    "name": "Pallavaram",
    "nameTa": null
  },
  {
    "district": "Chengalpattu",
    "name": "Vandalur",
    "nameTa": null
  },
  {
    "district": "Chengalpattu",
    "name": "Thirukalukundram",
    "nameTa": null
  },
  {
    "district": "Chengalpattu",
    "name": "Madurantakam",
    "nameTa": null
  },
  {
    "district": "Chengalpattu",
    "name": "Cheyyur",
    "nameTa": null
  },
  {
    "district": "Chengalpattu",
    "name": "Tirupporur",
    "nameTa": null
  },
  {
    "district": "Chennai",
    "name": "Egmore",
    "nameTa": null
  },
  {
    "district": "Chennai",
    "name": "Mylapore",
    "nameTa": null
  },
  {
    "district": "Chennai",
    "name": "T.Nagar",
    "nameTa": null
  },
  {
    "district": "Chennai",
    "name": "Ambattur",
    "nameTa": null
  },
  {
    "district": "Chennai",
    "name": "Aminjikarai",
    "nameTa": null
  },
  {
    "district": "Chennai",
    "name": "Guindy",
    "nameTa": null
  },
  {
    "district": "Chennai",
    "name": "Madhavaram",
    "nameTa": null
  },
  {
    "district": "Chennai",
    "name": "Perambur",
    "nameTa": null
  },
  {
    "district": "Chennai",
    "name": "Tondiarpet",
    "nameTa": null
  },
  {
    "district": "Chennai",
    "name": "Velachery",
    "nameTa": null
  },
  {
    "district": "Coimbatore",
    "name": "Coimbatore North",
    "nameTa": null
  },
  {
    "district": "Coimbatore",
    "name": "Coimbatore South",
    "nameTa": null
  },
  {
    "district": "Coimbatore",
    "name": "Mettupalayam",
    "nameTa": null
  },
  {
    "district": "Coimbatore",
    "name": "Pollachi",
    "nameTa": null
  },
  {
    "district": "Coimbatore",
    "name": "Sulur",
    "nameTa": null
  },
  {
    "district": "Coimbatore",
    "name": "Valparai",
    "nameTa": null
  },
  {
    "district": "Coimbatore",
    "name": "Annur",
    "nameTa": null
  },
  {
    "district": "Coimbatore",
    "name": "Kinathukadavu",
    "nameTa": null
  },
  {
    "district": "Cuddalore",
    "name": "Cuddalore",
    "nameTa": null
  },
  {
    "district": "Cuddalore",
    "name": "Chidambaram",
    "nameTa": null
  },
  {
    "district": "Cuddalore",
    "name": "Panruti",
    "nameTa": null
  },
  {
    "district": "Cuddalore",
    "name": "Virudhachalam",
    "nameTa": null
  },
  {
    "district": "Cuddalore",
    "name": "Kattumannarkoil",
    "nameTa": null
  },
  {
    "district": "Cuddalore",
    "name": "Kurinjipadi",
    "nameTa": null
  },
  {
    "district": "Cuddalore",
    "name": "Tittakudi",
    "nameTa": null
  },
  {
    "district": "Dharmapuri",
    "name": "Dharmapuri",
    "nameTa": null
  },
  {
    "district": "Dharmapuri",
    "name": "Harur",
    "nameTa": null
  },
  {
    "district": "Dharmapuri",
    "name": "Palacode",
    "nameTa": null
  },
  {
    "district": "Dharmapuri",
    "name": "Pennagaram",
    "nameTa": null
  },
  {
    "district": "Dharmapuri",
    "name": "Pappireddipatti",
    "nameTa": null
  },
  {
    "district": "Dharmapuri",
    "name": "Nallampalli",
    "nameTa": null
  },
  {
    "district": "Dharmapuri",
    "name": "Karimangalam",
    "nameTa": null
  },
  {
    "district": "Dindigul",
    "name": "Dindigul East",
    "nameTa": null
  },
  {
    "district": "Dindigul",
    "name": "Dindigul West",
    "nameTa": null
  },
  {
    "district": "Dindigul",
    "name": "Palani",
    "nameTa": null
  },
  {
    "district": "Dindigul",
    "name": "Oddanchatram",
    "nameTa": null
  },
  {
    "district": "Dindigul",
    "name": "Kodaikanal",
    "nameTa": null
  },
  {
    "district": "Dindigul",
    "name": "Natham",
    "nameTa": null
  },
  {
    "district": "Dindigul",
    "name": "Nilakottai",
    "nameTa": null
  },
  {
    "district": "Dindigul",
    "name": "Vedasandur",
    "nameTa": null
  },
  {
    "district": "Erode",
    "name": "Erode",
    "nameTa": null
  },
  {
    "district": "Erode",
    "name": "Bhavani",
    "nameTa": null
  },
  {
    "district": "Erode",
    "name": "Gobichettipalayam",
    "nameTa": null
  },
  {
    "district": "Erode",
    "name": "Sathyamangalam",
    "nameTa": null
  },
  {
    "district": "Erode",
    "name": "Perundurai",
    "nameTa": null
  },
  {
    "district": "Erode",
    "name": "Anthiyur",
    "nameTa": null
  },
  {
    "district": "Erode",
    "name": "Kodumudi",
    "nameTa": null
  },
  {
    "district": "Erode",
    "name": "Modakurichi",
    "nameTa": null
  },
  {
    "district": "Kallakurichi",
    "name": "Kallakurichi",
    "nameTa": null
  },
  {
    "district": "Kallakurichi",
    "name": "Sankarapuram",
    "nameTa": null
  },
  {
    "district": "Kallakurichi",
    "name": "Chinnasalem",
    "nameTa": null
  },
  {
    "district": "Kallakurichi",
    "name": "Ulundurpet",
    "nameTa": null
  },
  {
    "district": "Kallakurichi",
    "name": "Tirukoilur",
    "nameTa": null
  },
  {
    "district": "Kallakurichi",
    "name": "Kalvarayan Hills",
    "nameTa": null
  },
  {
    "district": "Kancheepuram",
    "name": "Kancheepuram",
    "nameTa": null
  },
  {
    "district": "Kancheepuram",
    "name": "Sriperumbudur",
    "nameTa": null
  },
  {
    "district": "Kancheepuram",
    "name": "Uthiramerur",
    "nameTa": null
  },
  {
    "district": "Kancheepuram",
    "name": "Walajabad",
    "nameTa": null
  },
  {
    "district": "Kancheepuram",
    "name": "Kundrathur",
    "nameTa": null
  },
  {
    "district": "Kanniyakumari",
    "name": "Agastheeswaram",
    "nameTa": null
  },
  {
    "district": "Kanniyakumari",
    "name": "Thovalai",
    "nameTa": null
  },
  {
    "district": "Kanniyakumari",
    "name": "Kalkulam",
    "nameTa": null
  },
  {
    "district": "Kanniyakumari",
    "name": "Vilavancode",
    "nameTa": null
  },
  {
    "district": "Kanniyakumari",
    "name": "Killiyoor",
    "nameTa": null
  },
  {
    "district": "Kanniyakumari",
    "name": "Thiruvattar",
    "nameTa": null
  },
  {
    "district": "Karur",
    "name": "Karur",
    "nameTa": null
  },
  {
    "district": "Karur",
    "name": "Kulithalai",
    "nameTa": null
  },
  {
    "district": "Karur",
    "name": "Krishnarayapuram",
    "nameTa": null
  },
  {
    "district": "Karur",
    "name": "Aravakurichi",
    "nameTa": null
  },
  {
    "district": "Karur",
    "name": "Kadavur",
    "nameTa": null
  },
  {
    "district": "Karur",
    "name": "Manmangalam",
    "nameTa": null
  },
  {
    "district": "Karur",
    "name": "Pugalur",
    "nameTa": null
  },
  {
    "district": "Krishnagiri",
    "name": "Krishnagiri",
    "nameTa": null
  },
  {
    "district": "Krishnagiri",
    "name": "Hosur",
    "nameTa": null
  },
  {
    "district": "Krishnagiri",
    "name": "Denkanikottai",
    "nameTa": null
  },
  {
    "district": "Krishnagiri",
    "name": "Pochampalli",
    "nameTa": null
  },
  {
    "district": "Krishnagiri",
    "name": "Uthangarai",
    "nameTa": null
  },
  {
    "district": "Krishnagiri",
    "name": "Bargur",
    "nameTa": null
  },
  {
    "district": "Krishnagiri",
    "name": "Shoolagiri",
    "nameTa": null
  },
  {
    "district": "Krishnagiri",
    "name": "Anchetty",
    "nameTa": null
  },
  {
    "district": "Madurai",
    "name": "Madurai East",
    "nameTa": null
  },
  {
    "district": "Madurai",
    "name": "Madurai West",
    "nameTa": null
  },
  {
    "district": "Madurai",
    "name": "Madurai North",
    "nameTa": null
  },
  {
    "district": "Madurai",
    "name": "Madurai South",
    "nameTa": null
  },
  {
    "district": "Madurai",
    "name": "Melur",
    "nameTa": null
  },
  {
    "district": "Madurai",
    "name": "Usilampatti",
    "nameTa": null
  },
  {
    "district": "Madurai",
    "name": "Vadipatti",
    "nameTa": null
  },
  {
    "district": "Madurai",
    "name": "Peraiyur",
    "nameTa": null
  },
  {
    "district": "Madurai",
    "name": "Thirumangalam",
    "nameTa": null
  },
  {
    "district": "Madurai",
    "name": "Thiruparankundram",
    "nameTa": null
  },
  {
    "district": "Mayiladuthurai",
    "name": "Mayiladuthurai",
    "nameTa": null
  },
  {
    "district": "Mayiladuthurai",
    "name": "Sirkazhi",
    "nameTa": null
  },
  {
    "district": "Mayiladuthurai",
    "name": "Tharangambadi",
    "nameTa": null
  },
  {
    "district": "Mayiladuthurai",
    "name": "Kuthalam",
    "nameTa": null
  },
  {
    "district": "Nagapattinam",
    "name": "Nagapattinam",
    "nameTa": null
  },
  {
    "district": "Nagapattinam",
    "name": "Kilvelur",
    "nameTa": null
  },
  {
    "district": "Nagapattinam",
    "name": "Thirukkuvalai",
    "nameTa": null
  },
  {
    "district": "Nagapattinam",
    "name": "Vedaranyam",
    "nameTa": null
  },
  {
    "district": "Namakkal",
    "name": "Namakkal",
    "nameTa": null
  },
  {
    "district": "Namakkal",
    "name": "Rasipuram",
    "nameTa": null
  },
  {
    "district": "Namakkal",
    "name": "Tiruchengode",
    "nameTa": null
  },
  {
    "district": "Namakkal",
    "name": "Paramathi Velur",
    "nameTa": null
  },
  {
    "district": "Namakkal",
    "name": "Kumarapalayam",
    "nameTa": null
  },
  {
    "district": "Namakkal",
    "name": "Kolli Hills",
    "nameTa": null
  },
  {
    "district": "Namakkal",
    "name": "Sendamangalam",
    "nameTa": null
  },
  {
    "district": "Namakkal",
    "name": "Mohanur",
    "nameTa": null
  },
  {
    "district": "Nilgiris",
    "name": "Udhagamandalam",
    "nameTa": null
  },
  {
    "district": "Nilgiris",
    "name": "Coonoor",
    "nameTa": null
  },
  {
    "district": "Nilgiris",
    "name": "Kotagiri",
    "nameTa": null
  },
  {
    "district": "Nilgiris",
    "name": "Gudalur",
    "nameTa": null
  },
  {
    "district": "Nilgiris",
    "name": "Pandalur",
    "nameTa": null
  },
  {
    "district": "Nilgiris",
    "name": "Kundah",
    "nameTa": null
  },
  {
    "district": "Perambalur",
    "name": "Perambalur",
    "nameTa": null
  },
  {
    "district": "Perambalur",
    "name": "Kunnam",
    "nameTa": null
  },
  {
    "district": "Perambalur",
    "name": "Veppanthattai",
    "nameTa": null
  },
  {
    "district": "Perambalur",
    "name": "Alathur",
    "nameTa": null
  },
  {
    "district": "Pudukkottai",
    "name": "Pudukkottai",
    "nameTa": null
  },
  {
    "district": "Pudukkottai",
    "name": "Aranthangi",
    "nameTa": null
  },
  {
    "district": "Pudukkottai",
    "name": "Alangudi",
    "nameTa": null
  },
  {
    "district": "Pudukkottai",
    "name": "Gandarvakottai",
    "nameTa": null
  },
  {
    "district": "Pudukkottai",
    "name": "Illuppur",
    "nameTa": null
  },
  {
    "district": "Pudukkottai",
    "name": "Karambakudi",
    "nameTa": null
  },
  {
    "district": "Pudukkottai",
    "name": "Kulathur",
    "nameTa": null
  },
  {
    "district": "Pudukkottai",
    "name": "Manamelkudi",
    "nameTa": null
  },
  {
    "district": "Pudukkottai",
    "name": "Ponnamaravathi",
    "nameTa": null
  },
  {
    "district": "Pudukkottai",
    "name": "Thirumayam",
    "nameTa": null
  },
  {
    "district": "Ramanathapuram",
    "name": "Ramanathapuram",
    "nameTa": null
  },
  {
    "district": "Ramanathapuram",
    "name": "Paramakudi",
    "nameTa": null
  },
  {
    "district": "Ramanathapuram",
    "name": "Tiruvadanai",
    "nameTa": null
  },
  {
    "district": "Ramanathapuram",
    "name": "Mudukulathur",
    "nameTa": null
  },
  {
    "district": "Ramanathapuram",
    "name": "Kamuthi",
    "nameTa": null
  },
  {
    "district": "Ramanathapuram",
    "name": "Kadaladi",
    "nameTa": null
  },
  {
    "district": "Ramanathapuram",
    "name": "Rameswaram",
    "nameTa": null
  },
  {
    "district": "Ramanathapuram",
    "name": "Kilakarai",
    "nameTa": null
  },
  {
    "district": "Ranipet",
    "name": "Ranipet",
    "nameTa": null
  },
  {
    "district": "Ranipet",
    "name": "Arakkonam",
    "nameTa": null
  },
  {
    "district": "Ranipet",
    "name": "Arcot",
    "nameTa": null
  },
  {
    "district": "Ranipet",
    "name": "Nemili",
    "nameTa": null
  },
  {
    "district": "Ranipet",
    "name": "Sholinghur",
    "nameTa": null
  },
  {
    "district": "Ranipet",
    "name": "Walajapet",
    "nameTa": null
  },
  {
    "district": "Ranipet",
    "name": "Kalavai",
    "nameTa": null
  },
  {
    "district": "Salem",
    "name": "Salem",
    "nameTa": null
  },
  {
    "district": "Salem",
    "name": "Salem West",
    "nameTa": null
  },
  {
    "district": "Salem",
    "name": "Salem South",
    "nameTa": null
  },
  {
    "district": "Salem",
    "name": "Attur",
    "nameTa": null
  },
  {
    "district": "Salem",
    "name": "Mettur",
    "nameTa": null
  },
  {
    "district": "Salem",
    "name": "Omalur",
    "nameTa": null
  },
  {
    "district": "Salem",
    "name": "Sankagiri",
    "nameTa": null
  },
  {
    "district": "Salem",
    "name": "Vazhapadi",
    "nameTa": null
  },
  {
    "district": "Salem",
    "name": "Yercaud",
    "nameTa": null
  },
  {
    "district": "Salem",
    "name": "Gangavalli",
    "nameTa": null
  },
  {
    "district": "Salem",
    "name": "Edappadi",
    "nameTa": null
  },
  {
    "district": "Salem",
    "name": "Kadayampatti",
    "nameTa": null
  },
  {
    "district": "Salem",
    "name": "Pethanaickenpalayam",
    "nameTa": null
  },
  {
    "district": "Sivaganga",
    "name": "Sivaganga",
    "nameTa": null
  },
  {
    "district": "Sivaganga",
    "name": "Karaikudi",
    "nameTa": null
  },
  {
    "district": "Sivaganga",
    "name": "Devakottai",
    "nameTa": null
  },
  {
    "district": "Sivaganga",
    "name": "Manamadurai",
    "nameTa": null
  },
  {
    "district": "Sivaganga",
    "name": "Ilayangudi",
    "nameTa": null
  },
  {
    "district": "Sivaganga",
    "name": "Kalaiyarkoil",
    "nameTa": null
  },
  {
    "district": "Sivaganga",
    "name": "Singampunari",
    "nameTa": null
  },
  {
    "district": "Sivaganga",
    "name": "Tirupathur",
    "nameTa": null
  },
  {
    "district": "Tenkasi",
    "name": "Tenkasi",
    "nameTa": null
  },
  {
    "district": "Tenkasi",
    "name": "Sankarankovil",
    "nameTa": null
  },
  {
    "district": "Tenkasi",
    "name": "Shencottai",
    "nameTa": null
  },
  {
    "district": "Tenkasi",
    "name": "Kadayanallur",
    "nameTa": null
  },
  {
    "district": "Tenkasi",
    "name": "Alangulam",
    "nameTa": null
  },
  {
    "district": "Tenkasi",
    "name": "Veerakeralampudur",
    "nameTa": null
  },
  {
    "district": "Tenkasi",
    "name": "Sivagiri",
    "nameTa": null
  },
  {
    "district": "Tenkasi",
    "name": "Thiruvengadam",
    "nameTa": null
  },
  {
    "district": "Thanjavur",
    "name": "Thanjavur",
    "nameTa": null
  },
  {
    "district": "Thanjavur",
    "name": "Kumbakonam",
    "nameTa": null
  },
  {
    "district": "Thanjavur",
    "name": "Pattukkottai",
    "nameTa": null
  },
  {
    "district": "Thanjavur",
    "name": "Papanasam",
    "nameTa": null
  },
  {
    "district": "Thanjavur",
    "name": "Peravurani",
    "nameTa": null
  },
  {
    "district": "Thanjavur",
    "name": "Orathanadu",
    "nameTa": null
  },
  {
    "district": "Thanjavur",
    "name": "Thiruvaiyaru",
    "nameTa": null
  },
  {
    "district": "Thanjavur",
    "name": "Thiruvidaimarudur",
    "nameTa": null
  },
  {
    "district": "Thanjavur",
    "name": "Budalur",
    "nameTa": null
  },
  {
    "district": "Theni",
    "name": "Theni",
    "nameTa": null
  },
  {
    "district": "Theni",
    "name": "Periyakulam",
    "nameTa": null
  },
  {
    "district": "Theni",
    "name": "Uthamapalayam",
    "nameTa": null
  },
  {
    "district": "Theni",
    "name": "Andipatti",
    "nameTa": null
  },
  {
    "district": "Theni",
    "name": "Bodinayakanur",
    "nameTa": null
  },
  {
    "district": "Thoothukudi",
    "name": "Thoothukudi",
    "nameTa": null
  },
  {
    "district": "Thoothukudi",
    "name": "Kovilpatti",
    "nameTa": null
  },
  {
    "district": "Thoothukudi",
    "name": "Tiruchendur",
    "nameTa": null
  },
  {
    "district": "Thoothukudi",
    "name": "Srivaikuntam",
    "nameTa": null
  },
  {
    "district": "Thoothukudi",
    "name": "Ottapidaram",
    "nameTa": null
  },
  {
    "district": "Thoothukudi",
    "name": "Sathankulam",
    "nameTa": null
  },
  {
    "district": "Thoothukudi",
    "name": "Vilathikulam",
    "nameTa": null
  },
  {
    "district": "Thoothukudi",
    "name": "Ettayapuram",
    "nameTa": null
  },
  {
    "district": "Thoothukudi",
    "name": "Kayathar",
    "nameTa": null
  },
  {
    "district": "Tiruchirappalli",
    "name": "Tiruchirappalli West",
    "nameTa": null
  },
  {
    "district": "Tiruchirappalli",
    "name": "Tiruchirappalli East",
    "nameTa": null
  },
  {
    "district": "Tiruchirappalli",
    "name": "Srirangam",
    "nameTa": null
  },
  {
    "district": "Tiruchirappalli",
    "name": "Lalgudi",
    "nameTa": null
  },
  {
    "district": "Tiruchirappalli",
    "name": "Manachanallur",
    "nameTa": null
  },
  {
    "district": "Tiruchirappalli",
    "name": "Musiri",
    "nameTa": null
  },
  {
    "district": "Tiruchirappalli",
    "name": "Thottiyam",
    "nameTa": null
  },
  {
    "district": "Tiruchirappalli",
    "name": "Thuraiyur",
    "nameTa": null
  },
  {
    "district": "Tiruchirappalli",
    "name": "Manapparai",
    "nameTa": null
  },
  {
    "district": "Tiruchirappalli",
    "name": "Marungapuri",
    "nameTa": null
  },
  {
    "district": "Tirunelveli",
    "name": "Tirunelveli",
    "nameTa": null
  },
  {
    "district": "Tirunelveli",
    "name": "Palayamkottai",
    "nameTa": null
  },
  {
    "district": "Tirunelveli",
    "name": "Ambasamudram",
    "nameTa": null
  },
  {
    "district": "Tirunelveli",
    "name": "Nanguneri",
    "nameTa": null
  },
  {
    "district": "Tirunelveli",
    "name": "Radhapuram",
    "nameTa": null
  },
  {
    "district": "Tirunelveli",
    "name": "Cheranmahadevi",
    "nameTa": null
  },
  {
    "district": "Tirunelveli",
    "name": "Manur",
    "nameTa": null
  },
  {
    "district": "Tirunelveli",
    "name": "Thisayanvilai",
    "nameTa": null
  },
  {
    "district": "Tirupathur",
    "name": "Tirupathur",
    "nameTa": null
  },
  {
    "district": "Tirupathur",
    "name": "Vaniyambadi",
    "nameTa": null
  },
  {
    "district": "Tirupathur",
    "name": "Ambur",
    "nameTa": null
  },
  {
    "district": "Tirupathur",
    "name": "Natrampalli",
    "nameTa": null
  },
  {
    "district": "Tiruppur",
    "name": "Tiruppur North",
    "nameTa": null
  },
  {
    "district": "Tiruppur",
    "name": "Tiruppur South",
    "nameTa": null
  },
  {
    "district": "Tiruppur",
    "name": "Avinashi",
    "nameTa": null
  },
  {
    "district": "Tiruppur",
    "name": "Palladam",
    "nameTa": null
  },
  {
    "district": "Tiruppur",
    "name": "Udumalaipettai",
    "nameTa": null
  },
  {
    "district": "Tiruppur",
    "name": "Dharapuram",
    "nameTa": null
  },
  {
    "district": "Tiruppur",
    "name": "Kangeyam",
    "nameTa": null
  },
  {
    "district": "Tiruppur",
    "name": "Madathukulam",
    "nameTa": null
  },
  {
    "district": "Tiruppur",
    "name": "Uthukuli",
    "nameTa": null
  },
  {
    "district": "Tiruvallur",
    "name": "Tiruvallur",
    "nameTa": null
  },
  {
    "district": "Tiruvallur",
    "name": "Poonamallee",
    "nameTa": null
  },
  {
    "district": "Tiruvallur",
    "name": "Ambattur",
    "nameTa": null
  },
  {
    "district": "Tiruvallur",
    "name": "Avadi",
    "nameTa": null
  },
  {
    "district": "Tiruvallur",
    "name": "Gummidipoondi",
    "nameTa": null
  },
  {
    "district": "Tiruvallur",
    "name": "Ponneri",
    "nameTa": null
  },
  {
    "district": "Tiruvallur",
    "name": "Tiruttani",
    "nameTa": null
  },
  {
    "district": "Tiruvallur",
    "name": "Uthukottai",
    "nameTa": null
  },
  {
    "district": "Tiruvallur",
    "name": "Pallipattu",
    "nameTa": null
  },
  {
    "district": "Tiruvallur",
    "name": "R.K.Pet",
    "nameTa": null
  },
  {
    "district": "Tiruvannamalai",
    "name": "Tiruvannamalai",
    "nameTa": null
  },
  {
    "district": "Tiruvannamalai",
    "name": "Arani",
    "nameTa": null
  },
  {
    "district": "Tiruvannamalai",
    "name": "Cheyyar",
    "nameTa": null
  },
  {
    "district": "Tiruvannamalai",
    "name": "Polur",
    "nameTa": null
  },
  {
    "district": "Tiruvannamalai",
    "name": "Chengam",
    "nameTa": null
  },
  {
    "district": "Tiruvannamalai",
    "name": "Vandavasi",
    "nameTa": null
  },
  {
    "district": "Tiruvannamalai",
    "name": "Kalasapakkam",
    "nameTa": null
  },
  {
    "district": "Tiruvannamalai",
    "name": "Chetpet",
    "nameTa": null
  },
  {
    "district": "Tiruvannamalai",
    "name": "Jamunamarathur",
    "nameTa": null
  },
  {
    "district": "Tiruvannamalai",
    "name": "Kilpennathur",
    "nameTa": null
  },
  {
    "district": "Tiruvannamalai",
    "name": "Thandarampattu",
    "nameTa": null
  },
  {
    "district": "Tiruvannamalai",
    "name": "Vembakkam",
    "nameTa": null
  },
  {
    "district": "Tiruvarur",
    "name": "Tiruvarur",
    "nameTa": null
  },
  {
    "district": "Tiruvarur",
    "name": "Mannargudi",
    "nameTa": null
  },
  {
    "district": "Tiruvarur",
    "name": "Thiruthuraipoondi",
    "nameTa": null
  },
  {
    "district": "Tiruvarur",
    "name": "Nannilam",
    "nameTa": null
  },
  {
    "district": "Tiruvarur",
    "name": "Needamangalam",
    "nameTa": null
  },
  {
    "district": "Tiruvarur",
    "name": "Valangaiman",
    "nameTa": null
  },
  {
    "district": "Tiruvarur",
    "name": "Koothanallur",
    "nameTa": null
  },
  {
    "district": "Tiruvarur",
    "name": "Kodavasal",
    "nameTa": null
  },
  {
    "district": "Vellore",
    "name": "Vellore",
    "nameTa": null
  },
  {
    "district": "Vellore",
    "name": "Katpadi",
    "nameTa": null
  },
  {
    "district": "Vellore",
    "name": "Gudiyatham",
    "nameTa": null
  },
  {
    "district": "Vellore",
    "name": "Anaicut",
    "nameTa": null
  },
  {
    "district": "Vellore",
    "name": "K.V.Kuppam",
    "nameTa": null
  },
  {
    "district": "Vellore",
    "name": "Pernambut",
    "nameTa": null
  },
  {
    "district": "Viluppuram",
    "name": "Viluppuram",
    "nameTa": null
  },
  {
    "district": "Viluppuram",
    "name": "Tindivanam",
    "nameTa": null
  },
  {
    "district": "Viluppuram",
    "name": "Gingee",
    "nameTa": null
  },
  {
    "district": "Viluppuram",
    "name": "Kandachipuram",
    "nameTa": null
  },
  {
    "district": "Viluppuram",
    "name": "Marakkanam",
    "nameTa": null
  },
  {
    "district": "Viluppuram",
    "name": "Melmalayanur",
    "nameTa": null
  },
  {
    "district": "Viluppuram",
    "name": "Tiruvennainallur",
    "nameTa": null
  },
  {
    "district": "Viluppuram",
    "name": "Vanur",
    "nameTa": null
  },
  {
    "district": "Viluppuram",
    "name": "Vikravandi",
    "nameTa": null
  },
  {
    "district": "Virudhunagar",
    "name": "Virudhunagar",
    "nameTa": null
  },
  {
    "district": "Virudhunagar",
    "name": "Sivakasi",
    "nameTa": null
  },
  {
    "district": "Virudhunagar",
    "name": "Srivilliputhur",
    "nameTa": null
  },
  {
    "district": "Virudhunagar",
    "name": "Rajapalayam",
    "nameTa": null
  },
  {
    "district": "Virudhunagar",
    "name": "Aruppukkottai",
    "nameTa": null
  },
  {
    "district": "Virudhunagar",
    "name": "Sattur",
    "nameTa": null
  },
  {
    "district": "Virudhunagar",
    "name": "Kariapatti",
    "nameTa": null
  },
  {
    "district": "Virudhunagar",
    "name": "Tiruchuli",
    "nameTa": null
  },
  {
    "district": "Virudhunagar",
    "name": "Vembakottai",
    "nameTa": null
  },
  {
    "district": "Virudhunagar",
    "name": "Watrap",
    "nameTa": null
  }
];

export const ministrySeeds: MinistrySeed[] = [
  {
    "name": "Home, Prohibition and Excise",
    "nameTa": "உள்துறை, மதுவிலக்கு மற்றும் ஆயத்தீர்வை",
    "ministerName": null
  },
  {
    "name": "Revenue and Disaster Management",
    "nameTa": "வருவாய் மற்றும் பேரிடர் மேலாண்மை",
    "ministerName": null
  },
  {
    "name": "Rural Development and Panchayat Raj",
    "nameTa": "ஊரக வளர்ச்சி மற்றும் ஊராட்சி",
    "ministerName": null
  },
  {
    "name": "Municipal Administration and Water Supply",
    "nameTa": "நகராட்சி நிர்வாகம் மற்றும் குடிநீர் வழங்கல்",
    "ministerName": null
  },
  {
    "name": "Health and Family Welfare",
    "nameTa": "சுகாதாரம் மற்றும் குடும்ப நலன்",
    "ministerName": null
  },
  {
    "name": "School Education",
    "nameTa": "பள்ளிக் கல்வி",
    "ministerName": null
  },
  {
    "name": "Transport",
    "nameTa": "போக்குவரத்து",
    "ministerName": null
  },
  {
    "name": "Public Works",
    "nameTa": "பொதுப்பணி",
    "ministerName": null
  },
  {
    "name": "Agriculture and Farmers Welfare",
    "nameTa": "வேளாண்மை மற்றும் உழவர் நலன்",
    "ministerName": null
  },
  {
    "name": "Labour Welfare and Skill Development",
    "nameTa": "தொழிலாளர் நலன் மற்றும் திறன் மேம்பாடு",
    "ministerName": null
  },
  {
    "name": "Food and Consumer Protection",
    "nameTa": "உணவு மற்றும் நுகர்வோர் பாதுகாப்பு",
    "ministerName": null
  },
  {
    "name": "Energy",
    "nameTa": "எரிசக்தி",
    "ministerName": null
  },
  {
    "name": "Higher Education",
    "nameTa": "உயர் கல்வி",
    "ministerName": null
  },
  {
    "name": "Finance",
    "nameTa": "நிதி",
    "ministerName": null
  },
  {
    "name": "Commercial Taxes and Registration",
    "nameTa": "வணிக வரி மற்றும் பதிவு",
    "ministerName": null
  },
  {
    "name": "Industries",
    "nameTa": "தொழில்கள்",
    "ministerName": null
  },
  {
    "name": "Information Technology and Digital Services",
    "nameTa": "தகவல் தொழில்நுட்பம் மற்றும் டிஜிட்டல் சேவைகள்",
    "ministerName": null
  },
  {
    "name": "Housing and Urban Development",
    "nameTa": "வீட்டு வசதி மற்றும் நகர்ப்புற வளர்ச்சி",
    "ministerName": null
  },
  {
    "name": "Social Welfare and Women Empowerment",
    "nameTa": "சமூக நலன் மற்றும் மகளிர் உரிமை",
    "ministerName": null
  },
  {
    "name": "Environment, Climate Change and Forests",
    "nameTa": "சுற்றுச்சூழல் மற்றும் வனத்துறை",
    "ministerName": null
  },
  {
    "name": "Tourism, Culture and Religious Endowments",
    "nameTa": "சுற்றுலா, கலாச்சாரம் மற்றும் அறநிலையம்",
    "ministerName": null
  },
  {
    "name": "Fisheries and Fishermen Welfare",
    "nameTa": "மீன்வளம் மற்றும் மீனவர் நலன்",
    "ministerName": null
  },
  {
    "name": "Animal Husbandry and Dairy Development",
    "nameTa": "கால்நடை பராமரிப்பு மற்றும் பால்வளம்",
    "ministerName": null
  },
  {
    "name": "Adi Dravidar and Tribal Welfare",
    "nameTa": "ஆதி திராவிடர் மற்றும் பழங்குடியினர் நலன்",
    "ministerName": null
  },
  {
    "name": "Backward Classes Welfare",
    "nameTa": "பிற்படுத்தப்பட்டோர் நலன்",
    "ministerName": null
  },
  {
    "name": "Youth Welfare and Sports Development",
    "nameTa": "இளைஞர் நலன் மற்றும் விளையாட்டு மேம்பாடு",
    "ministerName": null
  }
];

export const departmentSeeds: DepartmentSeed[] = [
  {
    "ministry": "Home, Prohibition and Excise",
    "name": "Tamil Nadu Police",
    "nameTa": "தமிழ்நாடு காவல்துறை",
    "description": null
  },
  {
    "ministry": "Home, Prohibition and Excise",
    "name": "Prohibition and Excise Department",
    "nameTa": "மதுவிலக்கு மற்றும் ஆயத்தீர்வைத் துறை",
    "description": null
  },
  {
    "ministry": "Home, Prohibition and Excise",
    "name": "Fire and Rescue Services",
    "nameTa": "தீயணைப்பு மற்றும் மீட்புப் பணிகள்",
    "description": null
  },
  {
    "ministry": "Home, Prohibition and Excise",
    "name": "Prisons Department",
    "nameTa": "சிறைத்துறை",
    "description": null
  },
  {
    "ministry": "Revenue and Disaster Management",
    "name": "Revenue Department",
    "nameTa": "வருவாய்த்துறை",
    "description": null
  },
  {
    "ministry": "Revenue and Disaster Management",
    "name": "Registration Department",
    "nameTa": "பதிவுத்துறை",
    "description": null
  },
  {
    "ministry": "Revenue and Disaster Management",
    "name": "Survey and Settlement Department",
    "nameTa": "நில அளவை மற்றும் தீர்வைத் துறை",
    "description": null
  },
  {
    "ministry": "Revenue and Disaster Management",
    "name": "Urban Land Ceiling",
    "nameTa": "நகர்ப்புற நில உச்சவரம்பு",
    "description": null
  },
  {
    "ministry": "Rural Development and Panchayat Raj",
    "name": "Rural Development Department",
    "nameTa": "ஊரக வளர்ச்சித் துறை",
    "description": null
  },
  {
    "ministry": "Rural Development and Panchayat Raj",
    "name": "Panchayat Raj Department",
    "nameTa": "ஊராட்சித் துறை",
    "description": null
  },
  {
    "ministry": "Rural Development and Panchayat Raj",
    "name": "MGNREGA Cell",
    "nameTa": "மகாத்மா காந்தி தேசிய ஊரக வேலை உறுதித் திட்டம்",
    "description": null
  },
  {
    "ministry": "Municipal Administration and Water Supply",
    "name": "Municipal Administration Department",
    "nameTa": "நகராட்சி நிர்வாகத் துறை",
    "description": null
  },
  {
    "ministry": "Municipal Administration and Water Supply",
    "name": "Greater Chennai Corporation",
    "nameTa": "பெருநகர சென்னை மாநகராட்சி",
    "description": null
  },
  {
    "ministry": "Municipal Administration and Water Supply",
    "name": "Metro Water (CMWSSB)",
    "nameTa": "சென்னை பெருநகர குடிநீர் வாரியம்",
    "description": null
  },
  {
    "ministry": "Municipal Administration and Water Supply",
    "name": "TWAD Board",
    "nameTa": "தமிழ்நாடு குடிநீர் வடிகால் வாரியம்",
    "description": null
  },
  {
    "ministry": "Municipal Administration and Water Supply",
    "name": "Town Panchayats Directorate",
    "nameTa": "பேரூராட்சிகள் இயக்ககம்",
    "description": null
  },
  {
    "ministry": "Health and Family Welfare",
    "name": "Directorate of Public Health",
    "nameTa": "பொது சுகாதார இயக்ககம்",
    "description": null
  },
  {
    "ministry": "Health and Family Welfare",
    "name": "Directorate of Medical Services",
    "nameTa": "மருத்துவப் பணிகள் இயக்ககம்",
    "description": null
  },
  {
    "ministry": "Health and Family Welfare",
    "name": "Government Hospitals Administration",
    "nameTa": "அரசு மருத்துவமனைகள் நிர்வாகம்",
    "description": null
  },
  {
    "ministry": "Health and Family Welfare",
    "name": "Drug Control Administration",
    "nameTa": "மருந்து கட்டுப்பாட்டு நிர்வாகம்",
    "description": null
  },
  {
    "ministry": "School Education",
    "name": "Directorate of School Education",
    "nameTa": "பள்ளிக் கல்வி இயக்ககம்",
    "description": null
  },
  {
    "ministry": "School Education",
    "name": "Directorate of Elementary Education",
    "nameTa": "தொடக்கக் கல்வி இயக்ககம்",
    "description": null
  },
  {
    "ministry": "School Education",
    "name": "Teachers Recruitment Board",
    "nameTa": "ஆசிரியர் தேர்வு வாரியம்",
    "description": null
  },
  {
    "ministry": "Transport",
    "name": "Regional Transport Offices (RTO)",
    "nameTa": "வட்டார போக்குவரத்து அலுவலகங்கள்",
    "description": null
  },
  {
    "ministry": "Transport",
    "name": "Tamil Nadu State Transport Corporation",
    "nameTa": "தமிழ்நாடு அரசு போக்குவரத்துக் கழகம்",
    "description": null
  },
  {
    "ministry": "Transport",
    "name": "Motor Vehicles Inspection",
    "nameTa": "மோட்டார் வாகன ஆய்வு",
    "description": null
  },
  {
    "ministry": "Public Works",
    "name": "Highways Department",
    "nameTa": "நெடுஞ்சாலைத் துறை",
    "description": null
  },
  {
    "ministry": "Public Works",
    "name": "Public Works Department (PWD)",
    "nameTa": "பொதுப்பணித் துறை",
    "description": null
  },
  {
    "ministry": "Public Works",
    "name": "Water Resources Department",
    "nameTa": "நீர்வளத் துறை",
    "description": null
  },
  {
    "ministry": "Agriculture and Farmers Welfare",
    "name": "Agriculture Department",
    "nameTa": "வேளாண்மைத் துறை",
    "description": null
  },
  {
    "ministry": "Agriculture and Farmers Welfare",
    "name": "Horticulture Department",
    "nameTa": "தோட்டக்கலைத் துறை",
    "description": null
  },
  {
    "ministry": "Agriculture and Farmers Welfare",
    "name": "Agricultural Marketing Board",
    "nameTa": "வேளாண் சந்தைப்படுத்தல் வாரியம்",
    "description": null
  },
  {
    "ministry": "Labour Welfare and Skill Development",
    "name": "Labour Department",
    "nameTa": "தொழிலாளர் துறை",
    "description": null
  },
  {
    "ministry": "Labour Welfare and Skill Development",
    "name": "Employment and Training Department",
    "nameTa": "வேலைவாய்ப்பு மற்றும் பயிற்சித் துறை",
    "description": null
  },
  {
    "ministry": "Food and Consumer Protection",
    "name": "Civil Supplies and Consumer Protection",
    "nameTa": "நுகர்பொருள் வழங்கல் மற்றும் நுகர்வோர் பாதுகாப்பு",
    "description": null
  },
  {
    "ministry": "Food and Consumer Protection",
    "name": "Public Distribution System (Ration Shops)",
    "nameTa": "பொது விநியோகத் திட்டம் (நியாய விலைக் கடைகள்)",
    "description": null
  },
  {
    "ministry": "Food and Consumer Protection",
    "name": "Food Safety Department",
    "nameTa": "உணவுப் பாதுகாப்புத் துறை",
    "description": null
  },
  {
    "ministry": "Energy",
    "name": "TANGEDCO (Electricity Board)",
    "nameTa": "தமிழ்நாடு மின் உற்பத்தி மற்றும் பகிர்மானக் கழகம்",
    "description": null
  },
  {
    "ministry": "Energy",
    "name": "TANTRANSCO",
    "nameTa": "தமிழ்நாடு மின் பரிமாற்றக் கழகம்",
    "description": null
  },
  {
    "ministry": "Higher Education",
    "name": "Directorate of Collegiate Education",
    "nameTa": "கல்லூரிக் கல்வி இயக்ககம்",
    "description": null
  },
  {
    "ministry": "Higher Education",
    "name": "Directorate of Technical Education",
    "nameTa": "தொழில்நுட்பக் கல்வி இயக்ககம்",
    "description": null
  },
  {
    "ministry": "Finance",
    "name": "Treasuries and Accounts Department",
    "nameTa": "கருவூலம் மற்றும் கணக்குத் துறை",
    "description": null
  },
  {
    "ministry": "Finance",
    "name": "Small Savings Department",
    "nameTa": "சிறு சேமிப்புத் துறை",
    "description": null
  },
  {
    "ministry": "Commercial Taxes and Registration",
    "name": "Commercial Taxes Department",
    "nameTa": "வணிக வரித் துறை",
    "description": null
  },
  {
    "ministry": "Industries",
    "name": "Industries and Commerce Department",
    "nameTa": "தொழில் மற்றும் வணிகத் துறை",
    "description": null
  },
  {
    "ministry": "Industries",
    "name": "SIPCOT",
    "nameTa": "சிப்காட் (தொழில் வளர்ச்சி நிறுவனம்)",
    "description": null
  },
  {
    "ministry": "Industries",
    "name": "TIDCO",
    "nameTa": "டிட்கோ (தொழில் மேம்பாட்டு நிறுவனம்)",
    "description": null
  },
  {
    "ministry": "Industries",
    "name": "MSME Department",
    "nameTa": "குறு, சிறு, நடுத்தர தொழில் துறை",
    "description": null
  },
  {
    "ministry": "Information Technology and Digital Services",
    "name": "ELCOT",
    "nameTa": "எல்காட் (மின்னணு கழகம்)",
    "description": null
  },
  {
    "ministry": "Information Technology and Digital Services",
    "name": "Tamil Nadu e-Governance Agency (TNeGA)",
    "nameTa": "தமிழ்நாடு மின்னாட்சி முகமை",
    "description": null
  },
  {
    "ministry": "Housing and Urban Development",
    "name": "Tamil Nadu Housing Board",
    "nameTa": "தமிழ்நாடு வீட்டு வசதி வாரியம்",
    "description": null
  },
  {
    "ministry": "Housing and Urban Development",
    "name": "Tamil Nadu Urban Habitat Development Board",
    "nameTa": "நகர்ப்புற வாழிட மேம்பாட்டு வாரியம்",
    "description": null
  },
  {
    "ministry": "Housing and Urban Development",
    "name": "Directorate of Town and Country Planning",
    "nameTa": "நகர் மற்றும் ஊரமைப்பு இயக்ககம்",
    "description": null
  },
  {
    "ministry": "Housing and Urban Development",
    "name": "Chennai Metropolitan Development Authority (CMDA)",
    "nameTa": "சென்னை பெருநகர வளர்ச்சிக் குழுமம்",
    "description": null
  },
  {
    "ministry": "Social Welfare and Women Empowerment",
    "name": "Social Welfare Department",
    "nameTa": "சமூக நலத்துறை",
    "description": null
  },
  {
    "ministry": "Social Welfare and Women Empowerment",
    "name": "Integrated Child Development Services (ICDS)",
    "nameTa": "ஒருங்கிணைந்த குழந்தை வளர்ச்சித் திட்டம்",
    "description": null
  },
  {
    "ministry": "Social Welfare and Women Empowerment",
    "name": "Differently Abled Welfare Department",
    "nameTa": "மாற்றுத்திறனாளிகள் நலத்துறை",
    "description": null
  },
  {
    "ministry": "Environment, Climate Change and Forests",
    "name": "Forest Department",
    "nameTa": "வனத்துறை",
    "description": null
  },
  {
    "ministry": "Environment, Climate Change and Forests",
    "name": "Tamil Nadu Pollution Control Board",
    "nameTa": "தமிழ்நாடு மாசு கட்டுப்பாட்டு வாரியம்",
    "description": null
  },
  {
    "ministry": "Tourism, Culture and Religious Endowments",
    "name": "Tourism Department",
    "nameTa": "சுற்றுலாத் துறை",
    "description": null
  },
  {
    "ministry": "Tourism, Culture and Religious Endowments",
    "name": "Hindu Religious and Charitable Endowments (HR&CE)",
    "nameTa": "இந்து சமய அறநிலையத் துறை",
    "description": null
  },
  {
    "ministry": "Fisheries and Fishermen Welfare",
    "name": "Fisheries Department",
    "nameTa": "மீன்வளத் துறை",
    "description": null
  },
  {
    "ministry": "Animal Husbandry and Dairy Development",
    "name": "Animal Husbandry Department",
    "nameTa": "கால்நடை பராமரிப்புத் துறை",
    "description": null
  },
  {
    "ministry": "Animal Husbandry and Dairy Development",
    "name": "Aavin (Dairy Development)",
    "nameTa": "ஆவின் (பால்வளம்)",
    "description": null
  },
  {
    "ministry": "Adi Dravidar and Tribal Welfare",
    "name": "Adi Dravidar and Tribal Welfare Department",
    "nameTa": "ஆதி திராவிடர் மற்றும் பழங்குடியினர் நலத்துறை",
    "description": null
  },
  {
    "ministry": "Backward Classes Welfare",
    "name": "Backward Classes and Minorities Welfare Department",
    "nameTa": "பிற்படுத்தப்பட்டோர் மற்றும் சிறுபான்மையினர் நலத்துறை",
    "description": null
  },
  {
    "ministry": "Youth Welfare and Sports Development",
    "name": "Sports Development Authority of Tamil Nadu",
    "nameTa": "தமிழ்நாடு விளையாட்டு மேம்பாட்டு ஆணையம்",
    "description": null
  }
];

export const categorySeeds: CategorySeed[] = [
  {
    "name": "Bribery / Demand for Bribe",
    "nameTa": "லஞ்சம் / லஞ்சக் கோரிக்கை",
    "description": "Demanding or accepting money for services that should be free or standard"
  },
  {
    "name": "Extortion",
    "nameTa": "மிரட்டி பணம் பறித்தல்",
    "description": "Forcing citizens to pay money under threat or coercion"
  },
  {
    "name": "Embezzlement of Public Funds",
    "nameTa": "பொது நிதி மோசடி",
    "description": "Misappropriation of government funds or scheme money"
  },
  {
    "name": "Nepotism / Favoritism",
    "nameTa": "உறவினர் ஆதரவு / பாரபட்சம்",
    "description": "Unfair preference in appointments, contracts, or services"
  },
  {
    "name": "Land Records Fraud",
    "nameTa": "நில ஆவண மோசடி",
    "description": "Manipulation of patta, chitta, or land registration records"
  },
  {
    "name": "Ration / PDS Fraud",
    "nameTa": "ரேஷன் / பொது விநியோக மோசடி",
    "description": "Diversion or black-marketing of ration supplies"
  },
  {
    "name": "Tender Manipulation",
    "nameTa": "ஒப்பந்தப்புள்ளி முறைகேடு",
    "description": "Rigging or manipulating government tenders and contracts"
  },
  {
    "name": "Certificate / Service Delays for Bribe",
    "nameTa": "சான்றிதழ் தாமதம் லஞ்சத்திற்காக",
    "description": "Deliberate delays in certificates or services to extract bribes"
  },
  {
    "name": "Scheme Fund Misappropriation",
    "nameTa": "திட்ட நிதி முறைகேடு",
    "description": "Siphoning of welfare scheme benefits meant for citizens"
  },
  {
    "name": "Abuse of Power",
    "nameTa": "அதிகார துஷ்பிரயோகம்",
    "description": "Misuse of official position for personal gain"
  }
];

export const roleSeeds: RoleSeed[] = [
  {
    "name": "citizen",
    "nameTa": "குடிமகன்",
    "description": "Regular citizen who can file and track complaints"
  },
  {
    "name": "village_officer",
    "nameTa": "கிராம அதிகாரி",
    "description": "Village-level officer handling local complaints"
  },
  {
    "name": "taluk_officer",
    "nameTa": "தாலுகா அதிகாரி",
    "description": "Taluk-level officer overseeing complaints within a taluk"
  },
  {
    "name": "district_officer",
    "nameTa": "மாவட்ட அதிகாரி",
    "description": "District-level officer overseeing complaints in a district"
  },
  {
    "name": "department_officer",
    "nameTa": "துறை அதிகாரி",
    "description": "Department officer who handles complaints assigned to their department"
  },
  {
    "name": "ministry_officer",
    "nameTa": "அமைச்சக அதிகாரி",
    "description": "Ministry-level officer overseeing cross-department complaints"
  },
  {
    "name": "state_administrator",
    "nameTa": "மாநில நிர்வாகி",
    "description": "State-level administrator with broad oversight"
  },
  {
    "name": "super_admin",
    "nameTa": "தலைமை நிர்வாகி",
    "description": "Portal administrator with full system access"
  },
  {
    "name": "investigation_officer",
    "nameTa": "விசாரணை அதிகாரி",
    "description": "Specialist officer who conducts investigations and files case notes"
  },
  {
    "name": "moderator",
    "nameTa": "மட்டுப்படுத்துபவர்",
    "description": "Moderates complaint content and manages portal quality"
  },
  {
    "name": "auditor",
    "nameTa": "தணிக்கையாளர்",
    "description": "Read-only auditor with access to logs and reports"
  },
  {
    "name": "legal_officer",
    "nameTa": "சட்ட அதிகாரி",
    "description": "Legal officer who reviews complaints with legal implications"
  }
];
