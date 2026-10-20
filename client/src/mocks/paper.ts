/* Demo data until the API exists. Read it through @/store/api (paper service), not directly from components. */
import { DEFAULT_BLUEPRINT } from "@/features/paper-maker/helpers";
import type { BankQuestion, BlueprintRow, Paper, PaperCatalog, PaperQuestion, PaperQuestionType } from "@/types";

type ChapterSpec = [title: string, subTopics: string[]];
type BookSpec = { id: string; title: string; subject: string; chapters: ChapterSpec[] };

/** Boards → classes → books → chapters → sub topics. */
const spec: { boardId: string; name: string; shortName: string; classes: { id: string; name: string; books: BookSpec[] }[] }[] = [
  {
    boardId: "ptb",
    name: "Punjab Textbook Board",
    shortName: "PTB",
    classes: [
      {
        id: "ptb-9",
        name: "Class 9",
        books: [
          {
            id: "ptb-9-phy",
            title: "Physics 9",
            subject: "Physics",
            chapters: [
              ["Physical Quantities and Measurement", ["Physical quantities", "SI units and prefixes", "Scientific notation", "Measuring instruments"]],
              ["Kinematics", ["Rest and motion", "Scalars and vectors", "Speed, velocity and acceleration", "Graphical analysis of motion"]],
              ["Dynamics", ["Newton's laws of motion", "Momentum", "Friction"]],
              ["Turning Effect of Forces", ["Moment of a force", "Centre of gravity", "Equilibrium"]],
            ],
          },
          {
            id: "ptb-9-chem",
            title: "Chemistry 9",
            subject: "Chemistry",
            chapters: [
              ["Fundamentals of Chemistry", ["Branches of chemistry", "Elements, compounds and mixtures", "Atomic and molecular mass"]],
              ["Structure of Atoms", ["Atomic models", "Electronic configuration", "Isotopes"]],
              ["Periodic Table and Periodicity", ["Modern periodic table", "Periodic trends"]],
            ],
          },
          {
            id: "ptb-9-math",
            title: "Mathematics 9",
            subject: "Mathematics",
            chapters: [
              ["Matrices and Determinants", ["Types of matrices", "Addition and multiplication", "Inverse of a matrix"]],
              ["Real and Complex Numbers", ["Real numbers", "Laws of exponents", "Complex numbers"]],
              ["Logarithms", ["Scientific notation", "Laws of logarithms"]],
            ],
          },
        ],
      },
      {
        id: "ptb-10",
        name: "Class 10",
        books: [
          {
            id: "ptb-10-phy",
            title: "Physics 10",
            subject: "Physics",
            chapters: [
              ["Simple Harmonic Motion and Waves", ["Simple harmonic motion", "Damped oscillations", "Wave motion"]],
              ["Sound", ["Characteristics of sound", "Reflection of sound", "Audible frequency range"]],
              ["Geometrical Optics", ["Reflection of light", "Refraction of light", "Lenses"]],
            ],
          },
          {
            id: "ptb-10-bio",
            title: "Biology 10",
            subject: "Biology",
            chapters: [
              ["Gaseous Exchange", ["Gaseous exchange in plants", "Human respiratory system"]],
              ["Homeostasis", ["Homeostasis in plants", "The human urinary system"]],
              ["Coordination and Control", ["Nervous system", "Receptors in humans", "Endocrine system"]],
            ],
          },
        ],
      },
    ],
  },
  {
    boardId: "oxford",
    name: "Oxford University Press",
    shortName: "Oxford",
    classes: [
      {
        id: "oxford-7",
        name: "Class 7",
        books: [
          {
            id: "oxford-7-sci",
            title: "New Oxford Science 7",
            subject: "Science",
            chapters: [
              ["Cells and Organisms", ["Plant and animal cells", "Specialised cells"]],
              ["Particles", ["States of matter", "Diffusion"]],
              ["Forces", ["Types of forces", "Balanced and unbalanced forces"]],
            ],
          },
          {
            id: "oxford-7-math",
            title: "New Syllabus Mathematics 7",
            subject: "Mathematics",
            chapters: [
              ["Fractions and Decimals", ["Operations on fractions", "Decimals and rounding"]],
              ["Algebraic Expressions", ["Like and unlike terms", "Simplifying expressions"]],
            ],
          },
        ],
      },
      {
        id: "oxford-8",
        name: "Class 8",
        books: [
          {
            id: "oxford-8-sci",
            title: "New Oxford Science 8",
            subject: "Science",
            chapters: [
              ["Digestion", ["Food groups", "The digestive system"]],
              ["Electricity", ["Circuits", "Current and voltage"]],
              ["Light", ["Reflection", "Colours of light"]],
            ],
          },
          {
            id: "oxford-8-comp",
            title: "Oxford Computing 8",
            subject: "Computing",
            chapters: [
              ["Spreadsheets", ["Formulas and functions", "Charts"]],
              ["Programming", ["Algorithms", "Loops and conditions"]],
            ],
          },
        ],
      },
    ],
  },
];

export const paperCatalog: PaperCatalog = { boards: [], classes: [], books: [], chapters: [], subTopics: [] };
for (const b of spec) {
  paperCatalog.boards.push({ id: b.boardId, name: b.name, shortName: b.shortName });
  for (const c of b.classes) {
    paperCatalog.classes.push({ id: c.id, boardId: b.boardId, name: c.name });
    for (const book of c.books) {
      paperCatalog.books.push({ id: book.id, boardId: b.boardId, classId: c.id, title: book.title, subject: book.subject });
      book.chapters.forEach(([title, subs], i) => {
        const chapterId = `${book.id}-ch${i + 1}`;
        paperCatalog.chapters.push({ id: chapterId, bookId: book.id, number: i + 1, title });
        subs.forEach((t, j) => paperCatalog.subTopics.push({ id: `${chapterId}-t${j + 1}`, chapterId, title: t }));
      });
    }
  }
}

/** Real questions for Physics 9 (PTB), chapters 1 and 2. */
const written: Omit<BankQuestion, "id">[] = [
  { subTopicId: "ptb-9-phy-ch1-t1", type: "mcq", text: "Which of the following is a derived quantity?", options: ["Length", "Mass", "Velocity", "Time"], answer: "C" },
  { subTopicId: "ptb-9-phy-ch1-t1", type: "mcq", text: "How many base quantities are there in the SI system?", options: ["5", "6", "7", "8"], answer: "C" },
  { subTopicId: "ptb-9-phy-ch1-t1", type: "short", text: "Differentiate between base and derived quantities with two examples of each.", answer: "Base quantities are defined independently (length, mass); derived quantities are expressed in terms of base quantities (speed, force)." },
  { subTopicId: "ptb-9-phy-ch1-t2", type: "mcq", text: "The prefix 'micro' stands for:", options: ["10⁻³", "10⁻⁶", "10⁻⁹", "10⁶"], answer: "B" },
  { subTopicId: "ptb-9-phy-ch1-t2", type: "mcq", text: "The SI unit of temperature is:", options: ["Celsius", "Fahrenheit", "Kelvin", "Joule"], answer: "C" },
  { subTopicId: "ptb-9-phy-ch1-t2", type: "short", text: "What are prefixes? Write any four with their values.", answer: "Words or letters added before a unit to show multiples or sub-multiples: kilo 10³, mega 10⁶, milli 10⁻³, micro 10⁻⁶." },
  { subTopicId: "ptb-9-phy-ch1-t3", type: "mcq", text: "Write 0.00045 m in scientific notation.", options: ["4.5 × 10⁻³ m", "4.5 × 10⁻⁴ m", "45 × 10⁻⁵ m", "0.45 × 10⁻³ m"], answer: "B" },
  { subTopicId: "ptb-9-phy-ch1-t3", type: "short", text: "Why is scientific notation used? Express 1 500 000 km in scientific notation.", answer: "It writes very large or small numbers compactly; 1.5 × 10⁶ km." },
  { subTopicId: "ptb-9-phy-ch1-t4", type: "mcq", text: "The least count of a vernier callipers is:", options: ["1 mm", "0.1 mm", "0.01 mm", "0.001 mm"], answer: "B" },
  { subTopicId: "ptb-9-phy-ch1-t4", type: "mcq", text: "A screw gauge is used to measure:", options: ["Mass of a wire", "Diameter of a wire", "Length of a room", "Volume of a liquid"], answer: "B" },
  { subTopicId: "ptb-9-phy-ch1-t4", type: "long", text: "Describe the construction and working of a screw gauge. How is zero error corrected?", answer: "Frame, anvil, spindle, sleeve with main scale, thimble with circular scale; least count = pitch ÷ divisions; subtract positive zero error, add negative zero error." },
  { subTopicId: "ptb-9-phy-ch2-t1", type: "mcq", text: "A body is said to be at rest if it:", options: ["Moves with uniform speed", "Does not change its position with respect to its surroundings", "Moves in a circle", "Accelerates uniformly"], answer: "B" },
  { subTopicId: "ptb-9-phy-ch2-t1", type: "short", text: "Explain with an example that rest and motion are relative.", answer: "A passenger is at rest relative to the bus but in motion relative to a person on the road." },
  { subTopicId: "ptb-9-phy-ch2-t2", type: "mcq", text: "Which of the following is a vector quantity?", options: ["Speed", "Distance", "Displacement", "Mass"], answer: "C" },
  { subTopicId: "ptb-9-phy-ch2-t2", type: "short", text: "Differentiate between distance and displacement.", answer: "Distance is the total path length (scalar); displacement is the shortest straight line between start and end with direction (vector)." },
  { subTopicId: "ptb-9-phy-ch2-t3", type: "mcq", text: "A car accelerates uniformly from 15 m/s to 35 m/s in 5 s. Its acceleration is:", options: ["2 m/s²", "4 m/s²", "5 m/s²", "10 m/s²"], answer: "B" },
  { subTopicId: "ptb-9-phy-ch2-t3", type: "mcq", text: "The SI unit of acceleration is:", options: ["m/s", "m/s²", "m²/s", "s/m"], answer: "B" },
  { subTopicId: "ptb-9-phy-ch2-t3", type: "short", text: "Define uniform velocity and uniform acceleration.", answer: "Uniform velocity: equal displacements in equal intervals in the same direction. Uniform acceleration: equal changes in velocity in equal intervals." },
  { subTopicId: "ptb-9-phy-ch2-t3", type: "long", text: "Derive the first equation of motion, vf = vi + at, using a velocity-time graph.", answer: "Slope of the v–t graph gives a = (vf − vi)/t, so vf = vi + at." },
  { subTopicId: "ptb-9-phy-ch2-t4", type: "mcq", text: "The area under a velocity-time graph gives:", options: ["Acceleration", "Distance covered", "Speed", "Force"], answer: "B" },
  { subTopicId: "ptb-9-phy-ch2-t4", type: "short", text: "What does the slope of a distance-time graph represent?", answer: "Speed of the body." },
  { subTopicId: "ptb-9-phy-ch2-t4", type: "long", text: "Draw and explain distance-time graphs for a body at rest, moving with uniform speed and moving with variable speed.", answer: "Horizontal line (rest), straight sloping line (uniform speed), curve (variable speed)." },
];

/** Sample questions for every other sub topic, so any scope can be drawn from. */
function sample(subTopicId: string, title: string): Omit<BankQuestion, "id">[] {
  const t = title.toLowerCase();
  return [
    { subTopicId, type: "mcq", text: `Which statement about ${t} is correct?`, options: ["Sample choice A", "Sample choice B", "Sample choice C", "Sample choice D"], answer: "A" },
    { subTopicId, type: "mcq", text: `Which example best shows ${t}?`, options: ["Sample choice A", "Sample choice B", "Sample choice C", "Sample choice D"], answer: "B" },
    { subTopicId, type: "mcq", text: `Choose the term that matches this description of ${t}.`, options: ["Sample choice A", "Sample choice B", "Sample choice C", "Sample choice D"], answer: "C" },
    { subTopicId, type: "short", text: `Define ${t} and give one example.`, answer: `Model answer: a clear definition of ${t} with one example.` },
    { subTopicId, type: "short", text: `Explain ${t} in two or three sentences.`, answer: `Model answer: the key idea of ${t} in two or three sentences.` },
    { subTopicId, type: "long", text: `Describe ${t} in detail, with a labelled diagram or a worked example.`, answer: `Model answer: a full explanation of ${t} with a diagram or worked example.` },
  ];
}

const writtenTopics = new Set(written.map((q) => q.subTopicId));
export const questionBank: BankQuestion[] = [
  ...written,
  ...paperCatalog.subTopics.filter((s) => !writtenTopics.has(s.id)).flatMap((s) => sample(s.id, s.title)),
].map((q, i) => ({ ...q, id: `bq-${i + 1}` }));

const defaultBlueprint = DEFAULT_BLUEPRINT;

/** The first questions of each type in a scope, for the demo papers. */
function draw(subTopicIds: string[], blueprint: BlueprintRow[], prefix: string): PaperQuestion[] {
  return blueprint.flatMap((row) =>
    questionBank
      .filter((q) => q.type === row.type && subTopicIds.includes(q.subTopicId))
      .slice(0, row.count)
      .map((q, i) => ({ id: `${prefix}-${row.type}-${i + 1}`, type: q.type as PaperQuestionType, text: q.text, options: q.options, answer: q.answer, marks: row.marks, subTopicId: q.subTopicId, bankId: q.id }))
  );
}
const topicsOf = (...chapterIds: string[]) => paperCatalog.subTopics.filter((s) => chapterIds.includes(s.chapterId)).map((s) => s.id);
const instructions = "Attempt all questions. Write neatly. Marks for each question are shown against it.";

const kinematics = topicsOf("ptb-9-phy-ch2");
const measurement = topicsOf("ptb-9-phy-ch1", "ptb-9-phy-ch2");
const matrices = topicsOf("ptb-9-math-ch1");
const biology = topicsOf("ptb-10-bio-ch1", "ptb-10-bio-ch2");

export const papers: Paper[] = [
  {
    id: "pap-1",
    branchId: "br-1",
    teacherId: "STF-201",
    teacherName: "Dr. Tariq Mahmood",
    status: "draft",
    step: 5,
    boardId: "ptb",
    classId: "ptb-9",
    bookId: "ptb-9-phy",
    subTopicIds: measurement,
    blueprint: defaultBlueprint,
    questions: draw(measurement, defaultBlueprint, "pap-1"),
    details: { examName: "", date: "", timeAllowed: "60 minutes", instructions },
    createdAt: "2026-10-18T09:00:00",
    updatedAt: "2026-10-18T09:40:00",
    history: [{ at: "2026-10-18T09:00:00", by: "Dr. Tariq Mahmood (Teacher)", action: "created" }],
  },
  {
    id: "pap-2",
    branchId: "br-1",
    teacherId: "STF-201",
    teacherName: "Dr. Tariq Mahmood",
    status: "submitted",
    step: 6,
    boardId: "ptb",
    classId: "ptb-9",
    bookId: "ptb-9-phy",
    subTopicIds: kinematics,
    blueprint: [
      { type: "mcq", count: 5, marks: 1 },
      { type: "short", count: 3, marks: 3 },
      { type: "long", count: 1, marks: 6 },
    ],
    questions: draw(kinematics, defaultBlueprint, "pap-2"),
    details: { examName: "Monthly test, Kinematics", date: "2026-10-26", timeAllowed: "45 minutes", instructions },
    createdAt: "2026-10-16T10:00:00",
    updatedAt: "2026-10-19T12:00:00",
    submittedAt: "2026-10-19T12:00:00",
    history: [
      { at: "2026-10-16T10:00:00", by: "Dr. Tariq Mahmood (Teacher)", action: "created" },
      { at: "2026-10-19T12:00:00", by: "Dr. Tariq Mahmood (Teacher)", action: "submitted" },
    ],
  },
  {
    id: "pap-3",
    branchId: "br-1",
    teacherId: "STF-201",
    teacherName: "Dr. Tariq Mahmood",
    status: "returned",
    step: 6,
    boardId: "ptb",
    classId: "ptb-9",
    bookId: "ptb-9-phy",
    subTopicIds: topicsOf("ptb-9-phy-ch1"),
    blueprint: [
      { type: "mcq", count: 4, marks: 1 },
      { type: "short", count: 2, marks: 3 },
    ],
    questions: draw(topicsOf("ptb-9-phy-ch1"), [
      { type: "mcq", count: 4, marks: 1 },
      { type: "short", count: 2, marks: 3 },
    ], "pap-3"),
    details: { examName: "Quiz, Measurement", date: "2026-10-22", timeAllowed: "20 minutes", instructions },
    createdAt: "2026-10-12T08:30:00",
    updatedAt: "2026-10-15T11:00:00",
    submittedAt: "2026-10-14T09:00:00",
    returnNote: "Section B has two questions on SI units. Replace one with a question on measuring instruments.",
    history: [
      { at: "2026-10-12T08:30:00", by: "Dr. Tariq Mahmood (Teacher)", action: "created" },
      { at: "2026-10-14T09:00:00", by: "Dr. Tariq Mahmood (Teacher)", action: "submitted" },
      { at: "2026-10-15T11:00:00", by: "Usman Qureshi (Branch admin)", action: "returned", note: "Section B has two questions on SI units. Replace one with a question on measuring instruments." },
    ],
  },
  {
    id: "pap-4",
    branchId: "br-1",
    teacherId: "STF-202",
    teacherName: "Saima Nazir",
    status: "printed",
    step: 6,
    boardId: "ptb",
    classId: "ptb-9",
    bookId: "ptb-9-math",
    subTopicIds: matrices,
    blueprint: defaultBlueprint,
    questions: draw(matrices, defaultBlueprint, "pap-4"),
    details: { examName: "Monthly test, Matrices", date: "2026-10-10", timeAllowed: "60 minutes", instructions },
    createdAt: "2026-10-05T10:00:00",
    updatedAt: "2026-10-08T14:00:00",
    submittedAt: "2026-10-07T10:00:00",
    printedAt: "2026-10-08T14:00:00",
    history: [
      { at: "2026-10-05T10:00:00", by: "Saima Nazir (Teacher)", action: "created" },
      { at: "2026-10-07T10:00:00", by: "Saima Nazir (Teacher)", action: "submitted" },
      { at: "2026-10-08T14:00:00", by: "Usman Qureshi (Branch admin)", action: "printed" },
    ],
  },
  {
    id: "pap-5",
    branchId: "br-1",
    teacherId: "STF-208",
    teacherName: "Nadia Hussain",
    status: "submitted",
    step: 6,
    boardId: "ptb",
    classId: "ptb-10",
    bookId: "ptb-10-bio",
    subTopicIds: biology,
    blueprint: defaultBlueprint,
    questions: draw(biology, defaultBlueprint, "pap-5"),
    details: { examName: "Mid-term exam, Biology", date: "2026-10-23", timeAllowed: "90 minutes", instructions },
    createdAt: "2026-10-15T10:00:00",
    updatedAt: "2026-10-18T16:00:00",
    submittedAt: "2026-10-18T16:00:00",
    history: [
      { at: "2026-10-15T10:00:00", by: "Nadia Hussain (Teacher)", action: "created" },
      { at: "2026-10-18T16:00:00", by: "Nadia Hussain (Teacher)", action: "submitted" },
    ],
  },
];
