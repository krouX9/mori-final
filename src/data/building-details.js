// ============================================================================
//  Per-building details — keyed by the raw GeoJSON `Name`
// ----------------------------------------------------------------------------
//  Fields per entry (all optional):
//    displayName     — what shows in the popup, modal, hash URL
//    longDescription — body copy for the modal "Read more" view
//    audio           — MP3 of the description being read aloud, used by the
//                      tour to drive the progress bar. Path is relative to
//                      the Vite base — drop the file in `public/audio/`
//                      and reference it as e.g.
//                          audio: 'audio/subbamma-house.mp3'
//                      When the tour stop has audio AND sound is on, the
//                      progress bar tracks playback and auto-advances when
//                      the track ends. If audio is missing OR muted, the
//                      tour falls back to a 60-second wall-clock timer.
//    gallery         — array of image URLs for the modal gallery
//
//  Keys MUST stay as the raw GeoJSON names (e.g. 'Subbamma Hospital') so the
//  GLB matcher in model-loader.js continues to bind via slug() — only the
//  values change.
//
//  longDescription accepts multi-line backtick strings; blank lines become
//  paragraph breaks in the modal (white-space: pre-line).
// ============================================================================


export const BUILDING_DETAILS = {
  'Jessy Flora Center': {
    displayName: 'Auditorium',
    // longDescription: `…`,
    gallery: [
      'images/Auditorium.webp',
    ]
  },
  'W1': {
    displayName: 'Washrooms',
    gallery: [
      'images/SchoolWashrooms.webp',
    ]
    // longDescription: `…`,
  },
  'Amy Dance Studio': {
    displayName: 'Amy Dance Studio',
    gallery: [
      'images/AmyDanceStudio.webp',
    ]
    // longDescription: `…`,
  },
  'School': {
    displayName: 'Riverside E.M. School',
    scaleOverride: 60,
    gallery: [
      'images/School.webp',
    ]
    // longDescription: `…`,
  },
  'Power Room': {
    displayName: 'Power Room',
    // longDescription: `…`,
  },
  'Conference Center': {
    displayName: 'Conference Center',
    // longDescription: `…`,
    gallery: [
      'images/ConferenceCenter.webp',
    ]
  },
  'Smart Village Center': {
    displayName: 'Smart Village Center',
    // longDescription: `…`,
  },
  'W2': {
    displayName: 'Washrooms',
    // longDescription: `…`,
  },
  'Chairman Residence': {
    displayName: 'Peniel Villa: A Place of Calling, Struggle, and Surrender',
    audio: 'audio/Peniel Villa.mp3',
    longDescription: `Peniel Villa serves as the residence of the Chairman, Solomon Darwin. The name "Peniel" comes from the biblical account in Genesis 32, where Jacob wrestled with God through the night and declared, "I have seen God face to face" after receiving a blessing. Peniel represents a place of encounter, perseverance, transformation, and blessing following struggle.
The name reflects not only a biblical story, but also a personal journey.
Throughout his life, Solomon Darwin faced significant adversities and challenges from childhood onward. Yet despite opportunities elsewhere and seasons of struggle, he could not escape what he believed was his calling to serve the people and ministries of Mori.
A defining part of that story began at birth.
Subbamma often reminded him of a night at Narsapur Mission Hospital, when as an infant he lay unconscious and near death. According to family accounts, the hospital was unwilling to admit him while he remained in a coma. Subbamma stayed through the night on the hospital veranda, praying earnestly for his life.
Her prayer was simple but costly:
"Lord, let this child live. If he lives, he will serve You all the days of his life."
The child survived.
For Subbamma, his life was not merely preserved—it was entrusted to a purpose.
Years later, Solomon Darwin would return repeatedly to Mori, helping expand ministries in education, healthcare, community development, and international partnerships connected to the legacy that began with Subbamma's faith.
Thus, Peniel Villa symbolizes more than a residence. It represents a lifelong journey of wrestling with purpose, returning to one's calling, and recognizing that blessings often emerge through hardship and surrender.
Like Jacob at Peniel, transformation came not through ease, but through persistence.
The building stands as a reminder that some callings are shaped long before they are understood—and some prayers offered in desperation continue to echo across generations.`,
    gallery: [
      'images/PenielVilla.webp',
    ]
  },
  'Teachers Quaters': {
    displayName: 'Isaacs Hall: A Story of Providence, Opportunity, and Vision',
    audio: 'audio/Issac Hall.mp3',
    longDescription: `Isaacs Hall was named in honor of John D. Isaacs, the renowned Berkeley engineer and oceanographer at the Scripps Institution of Oceanography. The building stands as a testimony to gratitude and to how one unexpected act of kindness helped shape the future of an entire community.
After earning his PhD in India, Dr. Solomon Raju struggled to find employment because of discrimination associated with being born into the untouchable community. Despite his academic achievements, opportunities remained closed for him. Determined to continue his scientific career, he applied to hundreds of universities in the United States, yet repeatedly received rejection letters, often due to lack of experience.
Among those institutions was the prestigious Scripps Institution of Oceanography, where his application was initially discarded.
At that time, Professor John D. Isaacs urgently needed a diligent researcher and inquired among colleagues whether any recent applications had been received. A colleague mentioned that an application from an Indian scientist named Solomon had just been thrown away. Upon hearing the name, Professor Isaacs retrieved the application from the trash and reviewed it personally. Recognizing potential, he offered Dr. Solomon Raju a position.
For Dr. Raju, the offer seemed almost impossible to believe. Prestigious institutions had opened a door where many others had refused him. He viewed the opportunity as an answer to the persistent prayers of his mother, Subbamma, who spent hours each day praying for her children and for the people of her village.
Yet another obstacle remained: travel expenses. Dr. Raju wrote back explaining that he was poor and unable to secure a loan to travel to America. In response, Professor Isaacs purchased and sent him an airline ticket to the United States.
That single act of generosity altered the trajectory of Dr. Raju's life—and ultimately contributed to the development of ministries and institutions that would emerge decades later on the Project India campus.
Out of gratitude, Dr. Raju desired to name the teachers' residence Isaacs Hall, acknowledging that God had used Professor Isaacs in a pivotal moment of his life.
The ripple effect of this opportunity helped contribute to the growth of what became the Project India Campus, including:
Riverside International School
Subbamma Mission Hospital
Jessy Flora Auditorium
Mike Van Daele Residential Hall
Conference and training facilities serving the broader community
A Building of Welcome and Prophetic Vision
Isaacs Hall was the second building constructed on the campus, completed in 1979 to welcome the first mission team from Little Brown Church in Pacifica, California. The seven-member team spent six weeks conducting evangelistic outreach throughout the surrounding region.
The team included:
Pastor Roland W. Fields
Dorothy Fields
Jack Boynton
Barbara Boynton
Joanne Whitmore
Bob Petree
Solomon Darwin (team leader)
During their visit in 1979, Pastor Roland W. Fields reportedly climbed to the roof of Isaacs Hall and looked across the surrounding rice fields. There, God gave him a vision where saw that one day the irrigated rice fields would be transformed into places of education, healing, and ministry—a school and hospital that would serve future generations. This was at a time when property did not belong to the Trust.
Years earlier, Subbamma's husband, Anandham, while taking his final breaths on the veranda of Subbamma House, gazed across those same rice fields. With his daughter Emily beside him, he shared that he was seeing the fields filled with lights and people arriving from all over the world. Within minutes of recounting this vision, he passed away.
What was once quiet rice fields eventually became a center for education, healthcare, ministry, and international collaboration, serving thousands through schools, medical outreach, and community development initiatives.
In later years, Isaacs Hall became residential housing for students and later for teachers at Riverside International School, continuing its legacy of supporting those dedicated to educating and mentoring future generations.
To many who know the history of Mori, the transformation of the rice fields into campuses of learning, healing, and service stands as a reminder that visions born in faith can extend far beyond one generation.`,
    gallery: [
      'images/IsaacHall.webp',
    ]
  },
  'Wephel Villa': {
    displayName: 'Bethel: The House of God',
    audio: 'audio/Bethel The House of God.mp3',
    longDescription: `Bethel, meaning "House of God," stands on a site deeply connected to the spiritual history and transformation of the Subbamma family.
Many years earlier, Subbamma and Anandham and their extended Nalli family, and members of the local community had helped build a Hindu temple at this very location dedicated to Rama, a revered deity in Hinduism. The temple was known as Rama Layam, meaning "House of Rama."
Over time, however, a profound spiritual change occurred within the family. As Subbamma, Anandham, and their household embraced the Christian faith, their beliefs and practices shifted dramatically. The former temple site eventually gave way to a new identity shaped by their understanding of God and their commitment to Christian ministry.
The name Bethel was later given by Solomon Darwin, inspired by the biblical account in Genesis 28, where Jacob encountered God in a dream and saw a ladder reaching between earth and heaven. Awakening from that encounter, Jacob declared:
"Surely the Lord is in this place… This is none other than the house of God."
Thus, Bethel came to symbolize a place of encounter with God, revelation, and transformation.
Today, the building serves as the residence of Dr. Latha Paul, Medical Director of Subbamma Mission Hospital.
The location also reflects an extraordinary continuity across generations.
Subbamma herself became one of the village's earliest missionary-trained midwives after receiving instruction from Charles Whitehouse, the missionary credited with helping save her life during a period of great despair. Through compassion and practical care, she assisted in delivering countless babies in the surrounding communities.
Generations later, the same grounds that once housed a temple—and later became associated with prayer and Christian ministry—now serve as the home of physicians dedicated to healing and caring for mothers and children.
In this way, the legacy continues.
What began with Subbamma assisting births in village homes has grown into a ministry of healthcare through doctors, nurses, and hospitals serving future generations.
Bethel stands as a testimony to transformation—of place, purpose, and legacy—from temple, to home, to healing ministry.`,
    gallery: [
      'images/BethelVilla.webp',
    ]
  },
  'Hebron Villa': {
    displayName: 'Hebron: A Place of Covenant, Family, and New Life',
    audio: 'audio/Hebron.mp3',
    longDescription: `Hebron is the residence built for physicians serving the women and families cared for through Subbamma Mission Hospital. Today it serves as home for the hospital's gynecology and obstetric care providers, whose work continues a long legacy of maternal and child health in the Mori community.

The name Hebron carries deep biblical significance. In Scripture, Hebron was a place associated with covenant, inheritance, faithfulness across generations, and family beginnings. It became the dwelling place of Abraham and later the burial place of Abraham, Sarah, Isaac, Rebekah, Jacob, and Leah—representing continuity between generations and God's enduring promises.

The name is fitting for a residence connected to those entrusted with caring for mothers and welcoming new life into the world. For generations, women in Mori often faced childbirth with limited medical support and significant risk. Long before hospitals or trained physicians were available, Subbamma served as one of the village's earliest missionary-trained midwives after receiving instruction from Charles Whitehouse, assisting mothers and delivering babies within homes and surrounding communities.

What began as compassionate care by a village midwife has grown into a broader ministry of maternal and women's healthcare through trained physicians, nurses, and modern medicine.

Today, the physicians who reside in Hebron continue this work—caring for women during pregnancy, childbirth, and times of medical need, helping safeguard both mothers and children.

Thus, Hebron represents more than a residence.

It symbolizes continuity across generations: from village births to hospital deliveries, from midwifery to specialized medical care, and from a grandmother's service to a community-wide ministry of healing.
Standing beside Bethel, the House of God, Hebron reflects another enduring truth—that faith, family, healing, and future generations remain deeply connected.

The residence serves as a reminder that every child welcomed safely into the world carries the possibility of transforming future generations, just as the lives of Subbamma and her family transformed Mori.`,
    gallery: [
      'images/HebronVilla.webp',
    ]

  },
  'Mike Van Daele Hall': {
    displayName: 'Mike Van Daele Hall: A Story of Faith and Provision',
    audio: 'audio/Mike Van Daelle Hall.mp3',
    longDescription: `Mike Van Daele Hall carries a remarkable history of faith, prayer, and unexpected provision.
The foundation stone for this building was laid on June 24, 1999, by Randy Thompson, approximately eight feet in front of where the structure now stands. At the time, the school did not yet own the land on which the building would eventually be built. The act was done entirely in faith, trusting that God would provide.
Shortly after the opening of Riverside International School, the number of residential students had grown beyond the capacity of Isaacs Hall, leaving many children without adequate sleeping facilities. Recognizing the urgent need, Randy Thompson, the founding International Principal, gathered the students in front of the future building site and asked them to pray that God would provide dormitories for boys and girls, along with a dining hall, recreation space, and study facilities.
The children prayed for a place they could call home.
After returning to the United States, Solomon Darwin received an unexpected phone call from a man who introduced himself as Mike Van Daele, a man he had never met. He was seeking counseling assistance for his daughter, who had been admitted to the University of Southern California, where Solomon Darwin was teaching at the time. Before ending the conversation, Mike shared that he and his wife had learned about the school in India and had decided to make a financial contribution toward its work.
Their donation proved extraordinarily generous—sufficient to complete the construction of the building and furnish it to accommodate approximately 100 students.
When Randy Thompson and Solomon Darwin returned the following year, the building stood completed.
For many, the hall became a testimony that the prayers of children had been heard.
What emerged was more than a dormitory. It provided students with something many had never experienced before: their own bed, protection from mosquitoes, access to running water, showers, sanitation facilities, and a safe environment conducive to study and growth.
Mike Van Daele Hall became a place of dignity, security, and opportunity—allowing generations of students to live, learn, and pursue an education that might otherwise have remained beyond reach.
The building stands as a reminder that some of the most significant transformations begin with simple prayers offered in faith.`,
    gallery: [
      'images/MikeVanDaeleHall.webp',
    ]
  },
  'Subbamma House': {
    displayName: 'Subbamma House: The Birthplace of a Legacy',
    audio: 'audio/Subbam house.mp3',
    longDescription: `Subbamma House marks the beginning of the story of the first Christian family in Mori and the origins of ministries that would eventually transform the community.

In the mid-1800s, the home was a simple thatched mud hut belonging to Nalli Venkata Swami. Seeking freedom from the oppression of local high-caste landlords and hoping for a better future, he and his only son, Nalli Anandham, traveled to Burma for work.

Into this family came Subbamma, married as a child bride and expected to serve her mother-in-law as a household servant while caring for her husband, nearly twenty years her senior, during his brief visits home from Burma. Her daily life began before dawn with rituals to household deities, followed by cooking, washing clothes, and laboring under bonded servitude for local landlords.

Everything changed when Subbamma accepted Christ in her late thirties. Her conversion brought severe persecution. The family's thatched home was burned down multiple times, and threats to their lives forced Subbamma to flee to Burma to join her husband. There, the family prospered financially.

Returning to Mori with her newborn son, Subbamma demonstrated extraordinary courage by rebuilding her home—the first tiled house with a cement floor in the untouchable community—despite fierce opposition from local landlords who believed that those considered "untouchable" were cursed and unworthy of such dignity. What began as a humble home soon became far more than a residence.

Subbamma House served as:
The first church gathering place 
A center for small businesses & livelihood (lacemaking, pickles, textiles for export to UK & Burma) 
A school for education 
A birthing center for mothers and infants 
An orphanage and refuge for vulnerable children 
A sanctuary for the poor, persecuted, and displaced 

The ministries born within the walls of Subbamma House eventually grew into enduring institutions that continue to serve the community today under the umbrella of Project India Compassion Trust:
Mori Baptist Church – continuing a legacy of worship, discipleship, and community transformation 
Riverside International School – advancing education and opportunity for future generations 
Subbamma Mission Hospital – extending compassionate healthcare and holistic healing to underserved communities 
Berkeley Smart Village Movement (2016), Mori Village later became the birthplace of the demonstrating how rural communities can become centers of innovation and sustainable development 
The once isolated and neglected road to Mori later became a corridor of innovation, hosting pilot projects by 86 Silicon Valley companies, whose technologies and models were showcased to the Chief Minister of Andhra Pradesh 
What began as the faith journey of a persecuted widow in a humble thatched hut evolved into a legacy of worship, education, healing, womens empowerment, innovation, and service.
Across generations, Subbamma's story demonstrates how courage, perseverance, and faith can transform not only a family, but an entire community—impacting lives from village pathways to hospitals, schools, churches, and global partnerships.`,
    gallery: [
      'images/SubbammaHouse.webp',
    ]
  },
  'Happiness and Peace': {
    displayName: 'Anand Residency: A Legacy of Peace, Courage, and Hospitality',
    audio: 'audio/Anand Residency.mp3',
    longDescription: `Anand Residency was constructed alongside the original Riverside School buildings between 1992 and 1996 and was named in honor of Nalli Anandham, a man remembered for perseverance, generosity, courage, and hospitality. The residence stands on land where Anandham once spent time caring for his cows and cattle. What was once grazing ground eventually became a home for educators, visitors, and leaders—reflecting his enduring legacy of stewardship and service.
Anandham is remembered not only as a successful contractor and provider, but also as the first man in Mori village to publicly accept Christ at a time when Christians faced persecution in the community. His decision carried social consequences and required considerable courage in a community where conversion could bring rejection, ridicule, or persecution. He donated large sums of land to the Mori Church and several others in need. His faith would later influence future generations and help lay the spiritual foundation for ministries that eventually emerged in Mori.
Although born into poverty and social exclusion, Anandham demonstrated extraordinary determination. Largely self-taught, he learned to read and write on his own and acquired mathematical skills through missionaries—abilities that enabled him to negotiate contracts, manage logistics, and oversee payroll operations.
After traveling to Burma in search of opportunity, Anandham became a successful contractor employing several hundred workers. His responsibilities included coordinating labor and operations connected to the international port system. At a time when education and advancement were nearly impossible for those from his social background, his accomplishments were remarkable.
Local accounts remember him as one of the first people from the region to travel by airplane to Burma, symbolizing both courage and a willingness to move beyond the limitations imposed by circumstance. Despite his success, Anandham remained known for generosity and hospitality. Those who knew him remembered a man with a welcoming spirit, deep concern for others, and willingness to share what he had.
His name, Anandham, means "happiness" and "peace," values reflected in the residence and in the life he lived.
The building was originally designed as the Principal's Residence for Riverside School and became home to educational leaders who shaped the institution during its formative years. Its first residents included Mr. I.D. Deva Das and his wife, the founding Principal and Headmistress of Riverside School. Over time, the residence also housed administrators including:
Jaideep Mukerji 
Dr. Nang Khan and family 
Today, Anand Residency serves as accommodation for guest faculty, school and hospital staff, visiting professionals, and international teams, continuing a longstanding tradition of hospitality.
More than a residence, Anand Residency honors a pioneer whose life crossed boundaries of caste, education, geography, and faith—from cattle fields in Mori, to leadership in Burma, to becoming the first Christian man in his village. The transformation of the land itself—from pasture to a place welcoming educators and guests from around the world—mirrors the transformation his life inspired across generations.`,
    gallery: [
      'images/AnandResidency.webp',
    ]
  },
  'Subbamma Chapel': {
    displayName: 'Chapel of Hope: A Legacy of Faith, Perseverance, and Redemption',
    audio: 'audio/Chapel of hope.mp3',
    longDescription: `Subbamma passed away at the age of 98 in the United States, where she had joined her son and spent the final decade of her life. As she approached death, she made a final request to her grandson, Solomon Darwin: that her body be returned to Mori, so her resting place might stand as a testimony to what God can do through those whom society has rejected, abandoned, and considered worthless.
In May 1988, her grandson honored her wish by bringing her body from the United States to Mori, India, where she was laid to rest beside her husband—the first Christian man in the village of Mori. During his years in Burma, he had been deeply influenced by the ministry of Adoniram Judson, whose missionary work helped shape early Christian faith among Burmese communities.
The Chapel of Hope was established as a place of prayer, reflection, counseling, and spiritual renewal for patients of Subbamma Mission Hospital, as well as for campus staff and faculty. It stands not only as a place of worship but also as a memorial to God's faithfulness across generations.
Leading to the chapel is the Gate of Hope and the Path of Hope, lined on both sides with Scripture passages that were among Subbamma's favorite Bible verses. The pathway symbolically traces the remarkable journey of her life:
An abandoned child bride
Years of oppression and suffering
A suicide attempt born out of despair
Rescue and encouragement through Charles Whitehouse
Her encounter with Christ and transformation of faith
The call to Burma and new beginnings
Success in business and financial stability in Burma
Survival through the bombings of World War II
Dangerous journeys through jungles, by ship, train, and on foot
Return to Mori to rebuild life amid poverty and persecution
New business ventures and a commitment to educating her children
Through perseverance and faith, what began in hardship became a story of extraordinary restoration.
In Mori, God's blessing upon Subbamma's family was witnessed across generations. Her elder son became the first person from the untouchable community in the state to earn a PhD, while her younger son became the first medical doctor from the untouchable community. Their achievements reflected not only personal determination but also the transformative power of education, faith, and opportunity.
The Chapel of Hope therefore stands as more than a building—it is a testimony that lives marked by rejection and suffering can become instruments of healing, leadership, and hope for future generations.`,
    gallery: [
      'images/ChappelofHope.webp',
    ]
  },
  'Subbamma Hospital': {
    displayName: 'Subbamma Mission Hospital',
    scaleOverride: 60,
    gallery: [
      'images/Hospital.webp',
    ]
    // longDescription: `…`,
  },
  'W': {
    displayName: 'School Washrooms',
    gallery: [
      'images/SchoolWashrooms.webp',
    ]
    // longDescription: `…`,
  },
  'Hospital Staff Quaters': {
    displayName: 'Hospital Staff Quarters',
    // longDescription: `…`,
    gallery: [
      'images/HospitalStaffQuarters.webp',
    ]
  },
};

export function getDetailsFor(name) {
  if (!name) return null;
  if (BUILDING_DETAILS[name]) return BUILDING_DETAILS[name];
  const lower = name.trim().toLowerCase();
  for (const key of Object.keys(BUILDING_DETAILS)) {
    if (key.toLowerCase() === lower) return BUILDING_DETAILS[key];
  }
  return null;
}
