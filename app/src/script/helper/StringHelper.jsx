exports.toTitleCase = function(str) {
  return str.replace(
    /\w\S*/g,
    (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1);
    }
  );
}
