/* Demo data until the API exists. Read it through @/store/api, not directly from components. */
import type { ChapterItem, PaperQuestion } from "@/types";

export const chapters: ChapterItem[] = [
  { id: "ch-1", number: 1, title: "Physical Quantities & Measurement", topicsCount: 6 },
  { id: "ch-2", number: 2, title: "Kinematics & Motion Graphs", topicsCount: 8 },
  { id: "ch-3", number: 3, title: "Dynamics, Forces & Friction", topicsCount: 7 },
  { id: "ch-4", number: 4, title: "Turning Effect of Forces & Equilibrium", topicsCount: 5 },
  { id: "ch-5", number: 5, title: "Gravitation & Orbital Dynamics", topicsCount: 4 },
  { id: "ch-6", number: 6, title: "Work, Energy & Power Principles", topicsCount: 6 },
];

/** The generated paper before any swaps. */
export const paperQuestions: PaperQuestion[] = [
  {
    id: "q-1",
    type: "mcq",
    chapter: "Kinematics",
    marks: 1,
    questionText:
      "A car accelerates uniformly from 15 m/s to 35 m/s in 5 seconds. What is its acceleration?",
    options: ["2 m/s²", "4 m/s²", "5 m/s²", "10 m/s²"],
  },
  {
    id: "q-2",
    type: "mcq",
    chapter: "Physical Quantities",
    marks: 1,
    questionText:
      "Which of the following is a derived physical quantity in SI system?",
    options: ["Length", "Mass", "Velocity", "Electric Current"],
  },
  {
    id: "q-3",
    type: "short",
    chapter: "Dynamics",
    marks: 3,
    questionText:
      "State Newton's Second Law of Motion and prove that F = ma from first principles.",
  },
  {
    id: "q-4",
    type: "short",
    chapter: "Turning Effect of Forces",
    marks: 3,
    questionText:
      "Define Center of Gravity and explain why racing cars are designed with broad wheelbases and low height.",
  },
  {
    id: "q-5",
    type: "long",
    chapter: "Work & Energy",
    marks: 6,
    questionText:
      "Derive the mathematical expression for Kinetic Energy of a body of mass m moving with velocity v. Also describe how energy is conserved in a simple pendulum.",
  },
];

/** Replacements offered by Swap, keyed by question id. */
export const alternativeQuestions: Record<string, PaperQuestion[]> = {
  "q-1": [
    {
      id: "q-1-alt1",
      type: "mcq",
      chapter: "Kinematics",
      marks: 1,
      questionText:
        "The slope of a velocity-time graph represents which physical quantity?",
      options: ["Distance", "Displacement", "Acceleration", "Speed"],
    },
    {
      id: "q-1-alt2",
      type: "mcq",
      chapter: "Kinematics",
      marks: 1,
      questionText:
        "A ball dropped from a height of 20 m reaches the ground in approximately how many seconds? (Take g = 10 m/s²)",
      options: ["1 s", "2 s", "4 s", "5 s"],
    },
  ],
  "q-2": [
    {
      id: "q-2-alt1",
      type: "mcq",
      chapter: "Physical Quantities",
      marks: 1,
      questionText:
        "The least count of a standard Vernier Calipers with 10 vernier divisions is:",
      options: ["0.1 cm", "0.01 cm", "0.001 cm", "1 mm"],
    },
  ],
  "q-3": [
    {
      id: "q-3-alt1",
      type: "short",
      chapter: "Dynamics",
      marks: 3,
      questionText:
        "Differentiate between mass and weight. Mention at least three distinctive characteristics.",
    },
  ],
  "q-4": [
    {
      id: "q-4-alt1",
      type: "short",
      chapter: "Turning Effect of Forces",
      marks: 3,
      questionText:
        "State the two conditions of equilibrium. Give a practical example of a body satisfying both conditions.",
    },
  ],
  "q-5": [
    {
      id: "q-5-alt1",
      type: "long",
      chapter: "Work & Energy",
      marks: 6,
      questionText:
        "Explain the principle of conservation of energy. Differentiate between renewable and non-renewable energy sources with two examples of each.",
    },
  ],
};
