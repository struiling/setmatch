$(document).foundation('topbar');

function selectTraitType() {
	$('#editTraitType,#addTraitType').change(function() {
		var traitType = $(this).val();
		if ((traitType == 'radio' || traitType == 'select' || traitType == 'checkbox') && 
				$(this).next('div.list-options').filter(':hidden').length) {

			console.log("show list-options");
			$(this).next('.list-options').show();
		} else if ((traitType == 'radio' || traitType == 'select' || traitType == 'checkbox') && 
				$(this).next().not('div.list-options').length) {
			console.log("add html");
			$(this).after('<div class="list-options"><div class="row-collapse"><input type="text" name="listoption[]" value="" class="list-option" /><a href="#" class="remove-list-option">x</a></div><div class="row-collapse"><input type="text" name="listoption[]" value="" class="list-option" /><a href="#" class="remove-list-option">x</a></div><div class="row"><a href="#" class="add-list-option">+</a></div></div>');
		} else if (traitType !== 'radio' && traitType !== 'select' && traitType !== 'checkbox' && 
				$(this).next('.list-options').filter(':visible').length) {
			console.log("hide list-options");
			$(this).next('.list-options').hide();
		}
	});
}

function addListOption(elem, e) {
	console.log("in addListOption()");
	/* go through all prior list option inputs and add remove buttons
	elem
		.parents('.list-options')
		.find('input.list-option')
		.filter(function() { return !$(this).next().is('a.remove-list-option') })
		.after('<a href="#" class="remove-list-option">x</a>');*/
	elem.before('<div class="row-collapse"><input type="text" name="listoption[]" value="" class="list-option" /><a href="#" class="remove-list-option">x</a></div>');
	e.preventDefault();
}

function removeListOption(elem, e) {
	// TODO: check if it is the last one of the set and prevent deletion if so
	console.log("in removeListOption()");
	elem.parent('.row-collapse').remove();
	e.preventDefault();
}

$(document).ready( function() {
	selectTraitType();
	//addListOption();
	//removeListOption();
	$('form').on('click', '.add-list-option', function(e) { 
		var elem = $(this);
		addListOption(elem, e) 
	});
	$('form').on('click', '.remove-list-option', function(e) { 
		var elem = $(this);
		removeListOption(elem, e) 
	});
});