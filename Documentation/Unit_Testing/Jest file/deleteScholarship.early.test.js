
// Unit tests for: deleteScholarship




const { deleteScholarship } = require('../deleteScholarship');
const pool = require("../../config/db");
jest.mock("../../config/db");

describe('deleteScholarship() deleteScholarship method', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {
        scholarship_id: 1,
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  // Happy Path: Successfully delete a scholarship
  it('should delete a scholarship successfully', async () => {
    // Arrange
    pool.query.mockResolvedValue({ rowCount: 1 });

    // Act
    await deleteScholarship(req, res);

    // Assert
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM osp.Scholarships'));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Scholarship deleted successfully',
      scholarship_id: 1,
    });
  });

  // Edge Case: Scholarship not found
  it('should return 404 if scholarship is not found', async () => {
    // Arrange
    pool.query.mockResolvedValue({ rowCount: 0 });

    // Act
    await deleteScholarship(req, res);

    // Assert
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM osp.Scholarships'));
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith('Scholarship not found');
  });

  // Edge Case: Database error
  it('should return 500 if there is a database error', async () => {
    // Arrange
    pool.query.mockRejectedValue(new Error('Database error'));

    // Act
    await deleteScholarship(req, res);

    // Assert
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM osp.Scholarships'));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      errMsg: 'Internal Server Error',
    });
  });

  // Edge Case: Invalid scholarship_id
  it('should return 400 if scholarship_id is not provided', async () => {
    // Arrange
    req.params.scholarship_id = undefined;

    // Act
    await deleteScholarship(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith('Scholarship ID is required');
  });
});

// End of unit tests for: deleteScholarship
