This was a game implemented in a 48-hour period for a game jam.  Please don't judge the code quality/maintainability as indicitive of my usual standards.

Live demo available:
russellmcc.github.io/ld37-imp/

You've been transformed into an imp, and trapped in a camera!
Now it's up to you to draw your way out by capturing the evil warlock Moorcock's vacation memories!
Stick it out, and you might be rewarded!

Art + Concept: Jenna Fizel
Programming: Russell McClellan + Open Source Contributors
Scenario: Russell McClellan
With apologies to the late, great Terry Pratchett.


Technical Deets:

Most of the time was spent on the image processing.  No neural networks were harmed in the production of this game.  We ended up going with the image similarity metric described in http://web.stanford.edu/class/cs231a/prev_projects/final_report.pdf (Bo Zhu + Ed Quigley's CS231a project from Stanford), using local features from the basic HOG algorithm implemented by harthur (https://github.com/harthur/hog-descriptor).  Our codebook was trained by k-means on 20,000 sketches from the dataset by Eintz., et al from here: http://cybertron.cg.tu-berlin.de/eitz/projects/classifysketch/.
Vacation photos provided from the sketch retrieval benchmark dataset by Eintz., et al available here: http://cybertron.cg.tu-berlin.de/eitz/tvcg_benchmark/index.html

(ugly):source code available: http://github.com/russellmcc/ld37-imp
