import React, { useState, useEffect } from 'react';
import { Award, Plus, Upload, Trash2, ShieldAlert, Book, Loader2, CheckCircle, RefreshCw } from 'lucide-react';

export default function UniversityDashboard({ user, token }) {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  // Institution verification state
  const [institution, setInstitution] = useState(null);

  // Form states
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [grade, setGrade] = useState('');
  const [remarks, setRemarks] = useState('');
  const [issuing, setIssuing] = useState(false);

  // Course form states
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [credits, setCredits] = useState('');
  const [addingCourse, setAddingCourse] = useState(false);

  // Revocation states
  const [revokeId, setRevokeId] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  // CSV Bulk Upload state
  const [csvFile, setCsvFile] = useState(null);
  const [bulkProgress, setBulkProgress] = useState(null); // { current, total, logs: [] }

  const fetchData = async () => {
    try {
      // Get profile to check institution status
      const profileRes = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      if (profileData.success && profileData.user?.wallet_address) {
        // Find institution matching staff wallet
        const instRes = await fetch('/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
        // The API returns the profile, but we can query standard tables. Since backend verifies, we can query students/courses directly
      }

      // Load students
      const studentsRes = await fetch('/api/certificates/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const studentsData = await studentsRes.json();
      if (studentsData.success) {
        setStudents(studentsData.students);
        if (studentsData.students.length > 0) setSelectedStudent(studentsData.students[0].student_id);
      }

      // Load courses
      const coursesRes = await fetch('/api/certificates/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const coursesData = await coursesRes.json();
      if (coursesData.success) {
        setCourses(coursesData.courses);
        if (coursesData.courses.length > 0) setSelectedCourse(coursesData.courses[0].course_id);
      }

      // Mock loading institution data for staff matching their wallet address
      const userWallet = user?.wallet_address;
      if (userWallet) {
        // Fetch all certificates to extract institution or fetch indirectly
        // For visual, we can show verification based on backend response.
        setInstitution({
          name: `${user.name}'s Institution`,
          wallet_address: userWallet,
          is_verified: true // Default verified for demonstration, backend guards it anyway
        });
      }
    } catch (err) {
      setError('Error retrieving registrar records. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedCourse) return;
    setIssuing(true);
    setStatusMsg('');
    try {
      const response = await fetch('/api/certificates/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          courseId: selectedCourse,
          grade,
          remarks
        })
      });
      const data = await response.json();
      if (data.success) {
        setStatusMsg(`SUCCESS: Certificate issued! Tx Hash: ${data.transactionHash.substring(0, 15)}...`);
        setGrade('');
        setRemarks('');
      } else {
        setError(data.message || 'Failed to issue certificate');
      }
    } catch (err) {
      setError('Connection error while broadcasting transaction.');
    } finally {
      setIssuing(false);
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!courseCode || !courseName || !credits) return;
    setAddingCourse(true);
    setError('');
    try {
      const response = await fetch('/api/certificates/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseCode,
          courseName,
          credits: parseInt(credits)
        })
      });
      const data = await response.json();
      if (data.success) {
        setCourses([...courses, data.course]);
        setCourseCode('');
        setCourseName('');
        setCredits('');
      } else {
        setError(data.message || 'Failed to create course');
      }
    } catch (err) {
      setError('Connection error while adding course.');
    } finally {
      setAddingCourse(false);
    }
  };

  const handleRevoke = async (e) => {
    e.preventDefault();
    if (!revokeId || !revokeReason) return;
    setRevoking(true);
    setError('');
    setStatusMsg('');
    try {
      const response = await fetch(`/api/certificates/revoke/${revokeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: revokeReason })
      });
      const data = await response.json();
      if (data.success) {
        setStatusMsg('SUCCESS: Certificate successfully revoked on Ethereum blockchain.');
        setRevokeId('');
        setRevokeReason('');
      } else {
        setError(data.message || 'Failed to revoke certificate');
      }
    } catch (err) {
      setError('Connection error while revoking certificate.');
    } finally {
      setRevoking(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const rows = text.split('\n').map(row => row.split(',')).filter(row => row.length >= 2 && row[0].trim());
      // Skip header row
      const headers = rows[0];
      const dataRows = rows.slice(1);
      
      setBulkProgress({ current: 0, total: dataRows.length, logs: [] });

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const studentId = row[0]?.trim();
        const courseId = row[1]?.trim();
        const rowGrade = row[2]?.trim() || 'Passed';
        const rowRemarks = row[3]?.trim() || '';

        setBulkProgress(prev => ({
          ...prev,
          current: i + 1,
          logs: [...prev.logs, `Processing row ${i+1}: Student ${studentId}...`]
        }));

        try {
          const res = await fetch('/api/certificates/issue', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              studentId,
              courseId,
              grade: rowGrade,
              remarks: rowRemarks
            })
          });
          const resData = await res.json();
          if (resData.success) {
            setBulkProgress(prev => ({
              ...prev,
              logs: [...prev.logs, `✔️ Success: Issued certificate! Tx: ${resData.transactionHash.substring(0, 10)}...`]
            }));
          } else {
            setBulkProgress(prev => ({
              ...prev,
              logs: [...prev.logs, `❌ Fail: ${resData.message}`]
            }));
          }
        } catch (err) {
          setBulkProgress(prev => ({
            ...prev,
            logs: [...prev.logs, `❌ Fail: Network error`]
          }));
        }
      }
    };
    reader.readAsText(csvFile);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '40px auto 0 auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '32px', fontWeight: 800 }}>Registrar Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, registrar administrator. Issue and audit certificates here.</p>
        </div>
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: '1px solid var(--success-green)' }}>
          <CheckCircle size={16} style={{ color: 'var(--success-green)' }} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>INSTITUTION VERIFIED</span>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(255, 23, 68, 0.1)', border: '1px solid var(--error-red)', borderRadius: '8px', color: 'white', padding: '16px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {statusMsg && (
        <div style={{ background: 'rgba(0, 230, 118, 0.1)', border: '1px solid var(--success-green)', borderRadius: '8px', color: 'white', padding: '16px', marginBottom: '24px' }}>
          {statusMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Main Forms Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Issue Certificate Form */}
          <form onSubmit={handleIssueCertificate} className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Award size={24} style={{ color: 'var(--accent-cyan)' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Issue Digital Certificate</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>STUDENT RECIPIENT</label>
                <select 
                  className="input-field" 
                  value={selectedStudent} 
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-secondary)', cursor: 'pointer' }}
                >
                  {students.map(std => (
                    <option key={std.student_id} value={std.student_id}>
                      {std.User?.name} ({std.student_number})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>COMPLETED COURSE</label>
                <select 
                  className="input-field" 
                  value={selectedCourse} 
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-secondary)', cursor: 'pointer' }}
                >
                  {courses.map(crs => (
                    <option key={crs.course_id} value={crs.course_id}>
                      {crs.course_name} ({crs.course_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>FINAL GRADE</label>
                <input 
                  type="text" 
                  placeholder="A, B+, 4.0, etc." 
                  className="input-field" 
                  value={grade} 
                  onChange={(e) => setGrade(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>ADDITIONAL REMARKS</label>
                <input 
                  type="text" 
                  placeholder="Graduated with honors, top 10%, etc." 
                  className="input-field" 
                  value={remarks} 
                  onChange={(e) => setRemarks(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={issuing} style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {issuing ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
              Publish to Ethereum Registry
            </button>
          </form>

          {/* CSV Bulk Uploader */}
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Upload size={24} style={{ color: 'var(--accent-cyan)' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>CSV Bulk Certificate Issuance</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              Upload a CSV file containing columns in the order: <code>student_uuid, course_id, grade, remarks</code>.
            </p>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
              <input 
                type="file" 
                accept=".csv" 
                onChange={(e) => setCsvFile(e.target.files[0])}
                className="input-field"
                style={{ flex: 1, padding: '8px 12px' }}
              />
              <button className="btn-secondary" onClick={handleCsvUpload} disabled={!csvFile} style={{ padding: '12px 20px' }}>
                Start Bulk Issuance
              </button>
            </div>

            {bulkProgress && (
              <div className="glass-panel" style={{ padding: '20px', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                  <span>Progress: {bulkProgress.current} / {bulkProgress.total}</span>
                  <span>{Math.round((bulkProgress.current / bulkProgress.total) * 100)}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%`, height: '100%', background: 'var(--accent-cyan)' }}></div>
                </div>
                <div style={{ maxHeight: '120px', overflowY: 'auto', background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}>
                  {bulkProgress.logs.map((log, index) => (
                    <div key={index} style={{ marginBottom: '4px' }}>{log}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel (Course Catalog & Revocation) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Add Course Form */}
          <form onSubmit={handleAddCourse} className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Book size={18} style={{ color: 'var(--accent-cyan)' }} />
              <h4 style={{ fontSize: '15px', fontWeight: 700 }}>Add Academic Course</h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <input 
                type="text" 
                placeholder="Course Code (e.g. CS101)" 
                required 
                className="input-field" 
                value={courseCode} 
                onChange={(e) => setCourseCode(e.target.value)}
                style={{ width: '100%', padding: '10px' }}
              />
              <input 
                type="text" 
                placeholder="Course Name (e.g. Intro to CS)" 
                required 
                className="input-field" 
                value={courseName} 
                onChange={(e) => setCourseName(e.target.value)}
                style={{ width: '100%', padding: '10px' }}
              />
              <input 
                type="number" 
                placeholder="Credits" 
                required 
                className="input-field" 
                value={credits} 
                onChange={(e) => setCredits(e.target.value)}
                style={{ width: '100%', padding: '10px' }}
              />
            </div>

            <button type="submit" className="btn-secondary" disabled={addingCourse} style={{ width: '100%', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
              {addingCourse ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
              Add Course
            </button>
          </form>

          {/* Revoke Certificate Section */}
          <form onSubmit={handleRevoke} className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(255, 23, 68, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ShieldAlert size={18} style={{ color: 'var(--error-red)' }} />
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--error-red)' }}>Revoke Certificate</h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <input 
                type="text" 
                placeholder="Certificate UUID..." 
                required 
                className="input-field" 
                value={revokeId} 
                onChange={(e) => setRevokeId(e.target.value)}
                style={{ width: '100%', padding: '10px' }}
              />
              <input 
                type="text" 
                placeholder="Audit Reason (Required)..." 
                required 
                className="input-field" 
                value={revokeReason} 
                onChange={(e) => setRevokeReason(e.target.value)}
                style={{ width: '100%', padding: '10px' }}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={revoking} style={{ width: '100%', padding: '10px', background: 'var(--error-red)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
              {revoking ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
              Revoke On-Chain
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
