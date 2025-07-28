const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../../../app");
const helper = require("../utils/testHelpers");
const votingService = require('../../../services/VotingService');
const Round = require("../../../models/Round");

const api = request(app);
