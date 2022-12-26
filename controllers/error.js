exports.useError = (req, res, next) => {
  res.status(404).render("404", { pageTitle: "Error 404" });
};


exports.badError = (req, res, next) => {
    res.status(500).render("500", { pageTitle: "Error 500" });
  };
  