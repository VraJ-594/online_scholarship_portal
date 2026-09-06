const pool = require("../config/db");

const getScholarships = async (req, res, next) => {
  try {
    // 1. Extract Query Parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6; // Match frontend grid limit
    const offset = (page - 1) * limit;
    const searchQuery = req.query.search || "";

    // 2. Base SQL Query
    let getQuery = `
      SELECT 
          s.scholarship_id,
          s.scholarship_name,
          s.amount,
          s.end_date,
          COUNT(a.applicant_id) AS applicants_count
      FROM osp.Scholarships AS s
      LEFT JOIN osp.applied_in AS a ON s.scholarship_id = a.scholarship_id
    `;

    const queryParams = [];

    // 3. Apply Search Filter if provided
    if (searchQuery.trim() !== "") {
      // ILIKE makes the search case-insensitive in PostgreSQL
      getQuery += ` WHERE s.scholarship_name ILIKE $1 `;
      queryParams.push(`%${searchQuery.trim()}%`);
    }

    // 4. Add Grouping, Sorting, and Pagination
    getQuery += `
      GROUP BY s.scholarship_id, s.scholarship_name, s.amount, s.end_date
      ORDER BY applicants_count DESC, s.scholarship_id ASC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    
    queryParams.push(limit, offset);

    // 5. Build the Total-Count Query (independent of the data query above)
    let totalCountQuery = `SELECT COUNT(*) FROM osp.Scholarships`;
    const countParams = [];
    if (searchQuery.trim() !== "") {
      totalCountQuery += ` WHERE scholarship_name ILIKE $1`;
      countParams.push(`%${searchQuery.trim()}%`);
    }

    // 6. Execute Data + Count Queries in Parallel (neither depends on the other)
    const [response, totalCountRes] = await Promise.all([
      pool.query(getQuery, queryParams),
      pool.query(totalCountQuery, countParams),
    ]);
    const totalScholarships = parseInt(totalCountRes.rows[0].count);

    // 7. Send Standardized JSON Response
    res.status(200).json({
      data: response.rows,
      meta: {
        total: totalScholarships,
        page,
        limit,
        totalPages: Math.ceil(totalScholarships / limit) || 1,
      }
    });

  } catch (error) {
    console.error("---> [getScholarships] Error:", error.message);
    next(error);
  }
};

module.exports = { getScholarships };