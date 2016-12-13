//@flow

const phraseBookThisScore = {
  "-2": ["This is the worst thing I've ever seen!",
        "How could you make something so ugly?",
        "This defies all reason and good taste!"],
  "-1": ["I've seen worse, but still, this won't do!",
         "Surely you can do better than this!",
         "You {}!",
         "This is... not great.",
         "I'm not a fan of this style..."],
  "1": ["I suppose this works.",
        "Imminently Adequate.",
        "This is a passable photo, I suppose.",
        "Great photo, awesome job!",
        "You're some {}.",
        "Good, my {}"],
  "2": ["It's so beautiful!",
        "The work of a true artist!"],
};

const phraseBookGameScore = {
  "-4": ["I should have ended you long ago!"],
  "-3": ["This is the end of you!"],
  "-2": ["One more mistake, and it's curtains\nfor you!"],
  "-1": ["I'm not pleased with your work, Imp!",
        "I was expecting more from you!",
        "Don't screw this up for me, Imp!",
        "Don't ruin my vacation!"],
  "0": ["I don't know what to think about you\nanymore",
        "My vacation depends on you!",
        "I am a confused man."],
  "1": ["This is the best vacation ever!",
        "I'm having a great time; aren't you?",
        "What sights will we see next?",
        "What a wonderful vacation."],
  "2": ["I'm starting to love you, imp!",
        "I get the feeling we could be friends.",
        "I almost feel bad for trapping you\nin that camera!",
        "You have the eyes of a painter.",
        "You have the soul of a craftsman."],
  "3": ["Come out of that camera and give me\na hug!"],
  "4": ["Your pictures have made me a better\n man."],
};

const adjectivesGood = ["strange", "crazy", "wonderful", "odd", "lovely", "amazing", "magnificent", "wild"];
const adjectivesBad = ["stupid", "ugly", "dumb", "idotic", "incompetent", "miserable", "little"];
const nounsGood = ["chap", "bloke", "dude", "friend", "imp", "hombre"];
const nounsBad = ["idiot", "fool", "jerk", "loser"];

function choose(a : Array<string>): string {
  return a[Math.floor(Math.random() * a.length)];
}

export function getPhrase(gameScore: number, thisScore: number) {
  let partA = choose(phraseBookThisScore[thisScore]);
  let partB = choose(phraseBookGameScore[gameScore]);

  const nameA = (thisScore > 0) ? choose(adjectivesGood) + " " + choose(nounsGood) : choose(adjectivesBad) + " " + choose(nounsBad);
  partA = partA.replace("{}", nameA);
  return partA + "\n" + partB;
}
