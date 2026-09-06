
// Unit tests for: handelpdfurls

const pool = require("../../config/db");
const { handelpdfurls } = require('../../controller/handelpdfurls');
jest.mock("../../config/db");

describe('handelpdfurls() handelpdfurls method', () => {
  let req, res;

  beforeEach(() => {
    req = { params: { email: '' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  // Happy Path Tests
  describe('Happy Paths', () => {
    it('should return document URLs for a valid email', async () => {
      // Arrange
      req.params.email = 'test@example.com';
      const mockResult = {
        rows: [{
          income_certificate: 'url1',
          bank_passbook: 'url2',
          aadhar_card: 'url3',
          tuition_fee_receipt: 'url4',
          non_tuition_fee_receipt: 'url5',
          class_10_mark_sheet: 'url6',
          class_12_mark_sheet: 'url7',
          current_education_mark_sheet: 'url8',
        }],
      };
      pool.query.mockResolvedValue(mockResult);

      // Act
      await handelpdfurls(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        incomeCertificate: 'url1',
        bankPassbook: 'url2',
        aadharcard: 'url3',
        tuitionFeeReceipt: 'url4',
        nonTuitionFeeReceipt: 'url5',
        class10MarkSheet: 'url6',
        class12MarkSheet: 'url7',
        currentEducationMarkSheet: 'url8',
      });
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('should return 404 if no documents are found for the email', async () => {
      // Arrange
      req.params.email = 'nonexistent@example.com';
      pool.query.mockResolvedValue({ rows: [] });

      // Act
      await handelpdfurls(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'No documents found for this email ID.' });
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      req.params.email = 'error@example.com';
      pool.query.mockRejectedValue(new Error('Database error'));

      // Act
      await handelpdfurls(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error.' });
    });

    it('should return null for missing document fields', async () => {
      // Arrange
      req.params.email = 'partial@example.com';
      const mockResult = {
        rows: [{
          income_certificate: null,
          bank_passbook: 'url2',
          aadhar_card: null,
          tuition_fee_receipt: 'url4',
          non_tuition_fee_receipt: null,
          class_10_mark_sheet: 'url6',
          class_12_mark_sheet: null,
          current_education_mark_sheet: 'url8',
        }],
      };
      pool.query.mockResolvedValue(mockResult);

      // Act
      await handelpdfurls(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        incomeCertificate: null,
        bankPassbook: 'url2',
        aadharcard: null,
        tuitionFeeReceipt: 'url4',
        nonTuitionFeeReceipt: null,
        class10MarkSheet: 'url6',
        class12MarkSheet: null,
        currentEducationMarkSheet: 'url8',
      });
    });
  });
});

// End of unit tests for: handelpdfurls
