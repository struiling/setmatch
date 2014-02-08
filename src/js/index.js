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
			$(this).after('<div class="list-options"><div class="row-collapse"><input type="text" name="listoption[]" value="" class="list-option" /></div><div class="row"><a href="#" class="add-list-option">+</a></div></div>');
			$(this).on('click', $(this).siblings('.add-list-option'), addListOption());
			$(this).on('click', $(this).siblings('.remove-list-option'), removeListOption());
		} else if (traitType !== 'radio' && traitType !== 'select' && traitType !== 'checkbox' && 
				$(this).next('.list-options').filter(':visible').length) {
			console.log("hide list-options");
			$(this).next('.list-options').hide();
		}
	});
}

function addListOption() {
	console.log("in addListOption()");
	$('a.add-list-option').click(function(e) {
		console.log("in addListOption().click");
		$(this)
			.parents('.list-options')
			.find('input.list-option')
			.filter(function() { return !$(this).next().is('a.remove-list-option') })
			.after('<a href="#" class="remove-list-option">x</a>');
		$(this).before('<div class="row-collapse"><input type="text" name="listoption[]" value="" class="list-option" /></div>');
		e.preventDefault();
	});
}

function removeListOption() {
	console.log("in removeListOption()");
	$('a.remove-list-option').click(function(e) {
		console.log("in addListOption().click");
		$(this)
			.parents('.row-collapse')
			.remove();
		e.preventDefault();
	});
}

$(document).ready( function() {
	selectTraitType();
	addListOption();
	removeListOption();
});