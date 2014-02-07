$(document).foundation('topbar');

var pickTraitType = function() {
	$('#editTraitType,#addTraitType').change(function() {
		var traitType = $(this).val();
		if ((traitType == 'radio' || traitType == 'select' || traitType == 'checkbox') && 
				$(this).next('div.list-options').filter(':hidden').length) {

			console.log("show list-options");
			$(this).next('.list-options').show();
		} else if ((traitType == 'radio' || traitType == 'select' || traitType == 'checkbox') && 
				$(this).next().not('div.list-options').length) {
			console.log("add html");
			$(this).after('<div class="list-options"><div class="row-collapse"><input type="text" name="listoption[]" value="" /></div><a href="#" class="add-list-option">+</a></div>');
			$(this).on('click', $(this).siblings('.add-list-option'), addListOption());
		} else if (traitType !== 'radio' && traitType !== 'select' && traitType !== 'checkbox' && 
				$(this).next('.list-options').filter(':visible').length) {
			console.log("hide list-options");
			$(this).next('.list-options').hide();
		}
	});
}
var addListOption = function() {
	console.log("in addListOption()");
	$('a.add-list-option').click(function(e) {
		console.log("in addListOption().click");
		$(this).parent('.list-options').find('input').after('<a href="#" class="remove-list-option postfix">x</a>');
		$(this).before('<div class="row-collapse"><input type="text" name="listoption[]" value="" /></div>');
		e.preventDefault();
	});
}

$(document).ready( function() {
	pickTraitType();
	addListOption();
});