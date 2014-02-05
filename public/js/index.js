$(document).foundation('topbar');

var trait = function() {
	$("#editTraitType").on("change", function() {
		if ($(this).value == "radio" || 
			$(this).value == "select" || 
			$(this).value == "checkbox") {

			$(this).append('<input type="text" name="listoption[]" value="" /> <br />
				<a href="#" class="add-option">+</a>');
		}
	});
}