
const LessonNote = require("./LessonNote");
const LessonNotePeriod = require("./LessonNotePeriod");

LessonNote.hasMany(LessonNotePeriod, {
  foreignKey: "lessonNoteId",
  as: "periods",
  onDelete: "CASCADE"
});

LessonNotePeriod.belongsTo(LessonNote, {
  foreignKey: "lessonNoteId",
  as: "lessonNote"
});

module.exports = {
  LessonNote,
  LessonNotePeriod
};
