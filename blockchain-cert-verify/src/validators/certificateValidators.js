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

const batchIssueSchema = {
  body: {
    certificates: [
      required('certificates array is required'),
      (value) => {
        if (!Array.isArray(value)) return 'certificates must be an array';
        if (value.length === 0) return 'certificates must not be empty';
        for (let i = 0; i < value.length; i++) {
          const item = value[i];
          if (!item.studentId || !item.courseId || !item.institutionId) {
            return `Entry ${i}: studentId, courseId, and institutionId are required`;
          }
        }
        return null;
      }
    ]
  }
};

const batchRevokeSchema = {
  body: {
    certificateIds: [
      required('certificateIds array is required'),
      (value) => {
        if (!Array.isArray(value)) return 'certificateIds must be an array';
        if (value.length === 0) return 'certificateIds must not be empty';
        return null;
      }
    ]
  }
};

const merkleRootSchema = {
  body: {
    merkleRoot: [required('merkleRoot is required')]
  }
};

const merkleProofSchema = {
  body: {
    leaf: [required('leaf is required')],
    proof: [required('proof is required')],
    issuerAddress: [required('issuerAddress is required')]
  }
};

const registerIssuerSchema = {
  body: {
    name: [required('name is required')],
    domain: [required('domain is required')]
  }
};

const privacyCommitmentSchema = {
  body: {
    certificateId: [required('certificateId is required')]
  }
};

const privacyBuildTreeSchema = {
  body: {
    certificateIds: [
      required('certificateIds is required'),
      (value) => {
        if (!Array.isArray(value)) return 'certificateIds must be an array';
        if (value.length === 0) return 'certificateIds must not be empty';
        return null;
      }
    ]
  }
};

const privacyVerifySchema = {
  body: {
    leaf: [required('leaf is required')],
    proof: [required('proof is required')],
    root: [required('root is required')]
  }
};

const nullifierSchema = {
  body: {
    nullifier: [required('nullifier is required')]
  }
};

module.exports = {
  issueSchema,
  revokeSchema,
  batchIssueSchema,
  batchRevokeSchema,
  merkleRootSchema,
  merkleProofSchema,
  registerIssuerSchema,
  privacyCommitmentSchema,
  privacyBuildTreeSchema,
  privacyVerifySchema,
  nullifierSchema
};
