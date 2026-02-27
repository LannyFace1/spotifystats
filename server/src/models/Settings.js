// App-wide settings stored in DB
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  value: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);

async function getSetting(key, defaultValue = null) {
  const doc = await Settings.findOne({ key });
  return doc ? doc.value : defaultValue;
}

async function setSetting(key, value) {
  return Settings.findOneAndUpdate({ key }, { value }, { upsert: true, new: true });
}

module.exports = { Settings, getSetting, setSetting };
