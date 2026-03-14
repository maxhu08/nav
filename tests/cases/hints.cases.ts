import type { HintDirectiveCase } from "~/tests/types";

export const hintDirectiveCases: HintDirectiveCase[] = [
  {
    name: "detects input",
    for: "input",
    recognized: ["<input type='text' aria-label='Search' />"],
    ignored: ["<button>Other</button>"]
  },
  {
    name: "detects attach",
    for: "attach",
    recognized: ["<input type='file' aria-label='Upload file' />"],
    ignored: ["<button>Other</button>"]
  },
  {
    name: "detects home",
    for: "home",
    recognized: ["<a href='/' rel='home'>Home</a>"],
    ignored: ["<button>Other</button>"]
  },
  {
    name: "detects sidebar",
    for: "sidebar",
    recognized: ["<button aria-label='Open sidebar' aria-controls='left-sidebar'>Menu</button>"],
    ignored: ["<button>Other</button>"]
  },
  {
    name: "detects next",
    for: "next",
    recognized: ["<a href='/next' rel='next'>Next</a>"],
    ignored: ["<button>Other</button>"]
  },
  {
    name: "detects prev",
    for: "prev",
    recognized: ["<a href='/prev' rel='prev'>Previous</a>"],
    ignored: ["<button>Other</button>"]
  },
  {
    name: "detects cancel",
    for: "cancel",
    recognized: ["<button aria-label='Cancel'>Cancel</button>"],
    ignored: ["<button>Other</button>"]
  },
  {
    name: "detects submit",
    for: "submit",
    recognized: ["<button type='submit'>Submit</button>"],
    ignored: ["<button>Other</button>"]
  },
  {
    name: "detects like",
    for: "like",
    recognized: ["<button aria-label='Like this post'>Like</button>"],
    ignored: ["<button>Other</button>"]
  },
  {
    name: "detects dislike",
    for: "dislike",
    recognized: ["<button aria-label='Dislike this post'>Dislike</button>"],
    ignored: ["<button>Other</button>"]
  },
  {
    name: "detects composer plus add-files button as attach",
    for: "attach",
    recognized: [
      "<button type='button' class='composer-btn' data-testid='composer-plus-btn' aria-label='Add files and more' id='composer-plus-btn' aria-haspopup='menu' aria-expanded='false' data-state='closed'><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' aria-hidden='true' class='icon'><use href='/cdn/assets/sprites-core-il7yfj1b.svg#6be74c' fill='currentColor'></use></svg></button>"
    ],
    ignored: ["<button>Other</button>"]
  }
];