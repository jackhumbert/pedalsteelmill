// the globals
var DEBUG = false;
var defaultTuning = "E9";
var defaultNoteOffset = 0;

var chordDB = new ChordDB();
chordDB.setTuning("E9");

var selectedMood = chordDB.chordMoods[defaultNoteOffset]; // major
var selectedChord = chordDB.majorChords[chordDB.chordNames[defaultNoteOffset].name]; // first major chord
var chartSelectedMood = chordDB.chordMoods[defaultNoteOffset];
var chordChart = []; // [ { root : "A", chord : chordDB.majorChords["A"], selectedPosition: 0, selectedMood: chordDB.chordMoods[0] } ]

document.addEventListener("DOMContentLoaded", function(event) { 
	// init the chord positions panel - chord/mood selectors and chord positions
	moodSelector = new TemplatedSelector(chordDB.chordMoods, '#moodSelector', '#tmplMoodSelector', function(mood){
		selectedMood = mood;
		updateSelectedChord(selectedChord);
	}, selectedMood, 'active');
	chordSelector = new TemplatedSelector(chordDB.chordNames, '#chordSelector', '#tmplChordSelector', function(chord){
		updateSelectedChord(chord);
	}, selectedChord, 'active');
	chordPositions = new ChordPositions(selectedChord, '#chordPositions', '#tmplChordPositions');

	// init the chord chart panel
	chartMoodSelector = new TemplatedSelector(chordDB.chordMoods, '#chartMoodSelector', '#tmplChartMoodSelector', function(mood){
	// update selectors
	var moods = document.querySelectorAll('#chartMoodSelector label');
		for ( var i=0; i<moods.length; i++ ) {
			moods[i].classList.remove('active');
			if ( moods[i].innerText == chartSelectedMood.label ) {
				moods[i].classList.add('active');
			}
		}
		chartSelectedMood = mood;
		chartChordSelector.mood = mood;
	}, chartSelectedMood, 'active');
	chartChordSelector = new ChordChartSelector(chordDB.chordNames, '#chartChordSelector', '#tmplChartChordSelector', chartSelectedMood);
	chartChords = new ChordChart(chordDB.chordMoods, chordChart, '#chordChart', '#tmplChordChart', onNoteDropped, onPositionChanged, onMoodChanged, onChordDeleted);

	// render the chord positions components
	moodSelector.render();
	chordSelector.render();
	chordPositions.render();
	// render the chord chart components
	chartMoodSelector.render();
	chartChordSelector.render();
	chartChords.render();
});

logit = function(logMsg) {
	if ( DEBUG ) {
		console.log(logMsg);
	}
}

getChordsFromMood = function(mood) {
	switch (mood) {
		case "maj":
			return chordDB.majorChords;
		case "min":
			return chordDB.minorChords;
		case "7":
			return chordDB.seventhChords;
		default:
			return null;
	}
}

updateSelectedChord = function(chord) {
	// update selectors
	var moods = document.querySelectorAll('#moodSelector label');
	for ( var i=0; i<moods.length; i++ ) {
		moods[i].classList.remove('active');
		if ( moods[i].innerText == selectedMood.label ) {
			moods[i].classList.add('active');
		}
	}
	var chords = document.querySelectorAll('#chordSelector label');
	for ( var i=0; i<chords.length; i++ ) {
		chords[i].classList.remove('active');
		if ( chords[i].innerText == chord.label ) {
			chords[i].classList.add('active');
		}
	}
	selectedChord = getChordsFromMood(selectedMood.name)[chord.name];
	chordPositions.update(selectedChord);
}

onNoteDropped = function(data, position) {
	var note = data.root;
	var chord = getChordsFromMood(chartSelectedMood.name)[note];

	var chordPos = 0; // todo select chordPos based on siblings position to select closest spot on the neck ??

	var chartPos = parseInt(position);
	if ( data.dragType == "copy" ) {
		var chordData = { root: note, chord: chord, selectedPosition: chordPos, selectedMood: chartSelectedMood };
		if ( isNaN(chartPos) ) {
			logit("Drag-copy, no position, inserting at end");
			chordChart[chordChart.length] = chordData;
		} else {
			logit("Drag-copy, with position of: " + chartPos);
			chordChart.splice(chartPos, 0, chordData);
		}
	} else {
		var origPos = data.originalPosition;
		var chart = chordChart;
    	var oitm = chart[origPos];
		chordChart.splice(origPos, 1);
		if ( isNaN(chartPos) ) {
			logit("Drag-move, no destination position, moving to end: " + origPos);
			chordChart[chordChart.length] = oitm;
		} else {
			logit("Drag-move, with destination position of: " + chartPos + ", moving item: " + origPos);
        	chordChart.splice(chartPos, 0, oitm);
		}
	}

	chartChords.update(chordChart);
}

onPositionChanged = function(chartPosition, chord, position) {
	var chordPosition = chord.chord.positions[position];
	logit("Position clicked - chart position: " + chartPosition + ", new chord info: " + chordPosition.fret + "(" + chordPosition.root + ")");
	chordChart[chartPosition].selectedPosition = position;
	chartChords.update(chordChart);
}

onMoodChanged = function(chartPosition, chord) {
	logit("Mood clicked - chart position: " + chartPosition + ", chord will change from: " + chord.selectedMood.label);
	if ( chord.selectedMood.name == "min" ) {
		chord.selectedMood = chordDB.chordMoods[0];
		chord.chord = chordDB.majorChords[chord.root];
	} else {
		chord.selectedMood = chordDB.chordMoods[1];
		chord.chord = chordDB.minorChords[chord.root];
	}
	chord.selectedPosition = 0;
	logit("   ..... to: " + chord.selectedMood.label);
	chordChart[chartPosition] = chord;
	chartChords.update(chordChart);
}

onChordDeleted = function(chartPosition, chord) {
	logit("Delete clicked - chart position: " + chartPosition + ", chord: " + chord.root);
	chordChart.splice(chartPosition, 1);
	chartChords.update(chordChart);
}
