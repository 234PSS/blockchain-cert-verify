const { required, isPositiveInt, optionalString } = require('./rules');

const issueSchema = {
  body: {
    studentId: [required('studentId is required'), isPositiveInt],
    courseId: [required('courseId is required'), isPositiveInt],
    institutionId: [required('institutionId is required'), isPositiveInt],
    grade: [optionalString()],
    remarks: [optionalString()]
  }
};

const revokeSchema = {
  body: {
    reason: [required('Revocation reason is required'), (value) => {
      if (value && String(value).trim().length < 3) return 'Reason must be at least 3 characters';
      return null;
    }]
  }
};

module.exports = { issueSchema, revokeSchema };
