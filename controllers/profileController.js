const { randomUUID } = require('crypto');
const pool = require('../config/db');
const { fetchGender, fetchAge, fetchNationality } = require('../services/externalApis');
const { getAgeGroup } = require('../utils/classify');

const createProfile = async (req, res) => {
  const { name } = req.body;

  if (name === undefined || name === null || name === '') {
    return res.status(400).json({ status: 'error', message: 'Missing or empty name' });
  }
  if (typeof name !== 'string') {
    return res.status(422).json({ status: 'error', message: 'Invalid type' });
  }

  const normalizedName = name.trim().toLowerCase();

  if (!normalizedName) {
    return res.status(400).json({ status: 'error', message: 'Missing or empty name' });
  }

  const existing = await pool.query('SELECT * FROM profiles WHERE name = $1', [normalizedName]);
  if (existing.rows.length > 0) {
    return res.status(200).json({
      status: 'success',
      message: 'Profile already exists',
      data: existing.rows[0],
    });
  }

  let genderData, agifyData, nationalizeData;

  try {
    genderData = await fetchGender(normalizedName);
  } catch (e) {
    return res.status(502).json({ status: 'error', message: e.message });
  }

  if (!genderData.gender || genderData.count === 0) {
    return res.status(502).json({ status: 'error', message: 'Genderize returned an invalid response' });
  }

  try {
    agifyData = await fetchAge(normalizedName);
  } catch (e) {
    return res.status(502).json({ status: 'error', message: e.message });
  }

  if (agifyData.age === null || agifyData.age === undefined) {
    return res.status(502).json({ status: 'error', message: 'Agify returned an invalid response' });
  }

  try {
    nationalizeData = await fetchNationality(normalizedName);
  } catch (e) {
    return res.status(502).json({ status: 'error', message: e.message });
  }

  if (!nationalizeData.country || nationalizeData.country.length === 0) {
    return res.status(502).json({ status: 'error', message: 'Nationalize returned an invalid response' });
  }

  const topCountry = nationalizeData.country.reduce((a, b) =>
    a.probability > b.probability ? a : b
  );

  const profile = {
    id: randomUUID(),
    name: normalizedName,
    gender: genderData.gender,
    gender_probability: genderData.probability,
    sample_size: genderData.count,
    age: agifyData.age,
    age_group: getAgeGroup(agifyData.age),
    country_id: topCountry.country_id,
    country_probability: topCountry.probability,
    created_at: new Date().toISOString(),
  };

  try {
    await pool.query(
      `INSERT INTO profiles (id, name, gender, gender_probability, sample_size, age, age_group, country_id, country_probability, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [profile.id, profile.name, profile.gender, profile.gender_probability, profile.sample_size, profile.age, profile.age_group, profile.country_id, profile.country_probability, profile.created_at]
    );
  } catch (e) {
    const existing = await pool.query('SELECT * FROM profiles WHERE name = $1', [normalizedName]);
    if (existing.rows.length > 0) {
      return res.status(200).json({ status: 'success', message: 'Profile already exists', data: existing.rows[0] });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to save profile' });
  }

  return res.status(201).json({ status: 'success', data: profile });
};

const getAllProfiles = async (req, res) => {
  let { gender, country_id, age_group } = req.query;

  let query = 'SELECT id, name, gender, age, age_group, country_id FROM profiles WHERE 1=1';
  const params = [];
  let count = 1;

  if (gender) {
    query += ` AND LOWER(gender) = $${count++}`;
    params.push(gender.toLowerCase());
  }
  if (country_id) {
    query += ` AND LOWER(country_id) = $${count++}`;
    params.push(country_id.toLowerCase());
  }
  if (age_group) {
    query += ` AND LOWER(age_group) = $${count++}`;
    params.push(age_group.toLowerCase());
  }

  const result = await pool.query(query, params);

  return res.status(200).json({
    status: 'success',
    count: result.rows.length,
    data: result.rows,
  });
};

const getProfileById = async (req, res) => {
  const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ status: 'error', message: 'Profile not found' });
  }
  return res.status(200).json({ status: 'success', data: result.rows[0] });
};

const deleteProfile = async (req, res) => {
  const result = await pool.query('DELETE FROM profiles WHERE id = $1', [req.params.id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ status: 'error', message: 'Profile not found' });
  }
  return res.sendStatus(204);
};

module.exports = { createProfile, getAllProfiles, getProfileById, deleteProfile };
