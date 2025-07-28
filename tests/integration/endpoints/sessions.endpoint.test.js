const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../../../app");
const helper = require("../utils/testHelpers");
const votingService = require('../../../services/VotingService');
const Session = require("../../../models/Session");

const api = request(app);
