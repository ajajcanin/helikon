export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      1,
      "always",
      [
        "catalog",
        "cart",
        "checkout",
        "orders",
        "journal",
        "audit",
        "settings",
        "users",
        "ui",
        "db",
        "import",
        "seo",
        "auth",
        "jobs",
        "email",
        "deps",
        "docs",
      ],
    ],
  },
};
