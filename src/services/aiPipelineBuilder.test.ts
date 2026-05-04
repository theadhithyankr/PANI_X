import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePipeline, VALID_ROUND_TYPES, type SuggestedRound } from './aiPipelineBuilder';
import * as groq from './groq';

// Mock the groq module
vi.mock('./groq', () => ({
    getGroqChatCompletion: vi.fn()
}));

describe('aiPipelineBuilder', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('generatePipeline', () => {
        it('should generate a valid pipeline with 3-6 rounds', async () => {
            const mockResponse = {
                rounds: [
                    {
                        roundName: 'Aptitude Test',
                        roundType: 'aptitude test',
                        dateOffsetDays: 0,
                        passingCriteria: 'Score 70% or higher'
                    },
                    {
                        roundName: 'Technical Assessment',
                        roundType: 'technical assessment',
                        dateOffsetDays: 3,
                        passingCriteria: 'Complete coding challenge successfully'
                    },
                    {
                        roundName: 'HR Interview',
                        roundType: 'HR interview',
                        dateOffsetDays: 7,
                        passingCriteria: 'Demonstrate cultural fit'
                    },
                    {
                        roundName: 'Technical Interview',
                        roundType: 'technical interview',
                        dateOffsetDays: 10,
                        passingCriteria: 'Show strong technical knowledge'
                    }
                ]
            };

            vi.mocked(groq.getGroqChatCompletion).mockResolvedValue(JSON.stringify(mockResponse));

            const result = await generatePipeline('Software Engineer', 'Senior', 'Engineering');

            expect(result.rounds).toHaveLength(4);
            expect(result.rounds[0].roundType).toBe('aptitude test');
            expect(result.warning).toBeUndefined();
        });

        it('should order rounds from least to most selective', async () => {
            const mockResponse = {
                rounds: [
                    {
                        roundName: 'Technical Interview',
                        roundType: 'technical interview',
                        dateOffsetDays: 10,
                        passingCriteria: 'Show strong technical knowledge'
                    },
                    {
                        roundName: 'Aptitude Test',
                        roundType: 'aptitude test',
                        dateOffsetDays: 0,
                        passingCriteria: 'Score 70% or higher'
                    },
                    {
                        roundName: 'HR Interview',
                        roundType: 'HR interview',
                        dateOffsetDays: 7,
                        passingCriteria: 'Demonstrate cultural fit'
                    }
                ]
            };

            vi.mocked(groq.getGroqChatCompletion).mockResolvedValue(JSON.stringify(mockResponse));

            const result = await generatePipeline('Software Engineer', 'Senior', 'Engineering');

            // Should be reordered: aptitude test, HR interview, technical interview
            expect(result.rounds[0].roundType).toBe('aptitude test');
            expect(result.rounds[1].roundType).toBe('HR interview');
            expect(result.rounds[2].roundType).toBe('technical interview');
        });

        it('should return warning when more than 6 rounds are generated', async () => {
            const mockResponse = {
                rounds: Array.from({ length: 7 }, (_, i) => ({
                    roundName: `Round ${i + 1}`,
                    roundType: 'aptitude test',
                    dateOffsetDays: i * 3,
                    passingCriteria: 'Pass criteria'
                }))
            };

            vi.mocked(groq.getGroqChatCompletion).mockResolvedValue(JSON.stringify(mockResponse));

            const result = await generatePipeline('Software Engineer', 'Senior', 'Engineering');

            expect(result.rounds.length).toBeGreaterThan(6);
            expect(result.warning).toContain('more than 6 rounds');
        });

        it('should return warning when fewer than 3 rounds are generated', async () => {
            const mockResponse = {
                rounds: [
                    {
                        roundName: 'Aptitude Test',
                        roundType: 'aptitude test',
                        dateOffsetDays: 0,
                        passingCriteria: 'Score 70% or higher'
                    },
                    {
                        roundName: 'Technical Interview',
                        roundType: 'technical interview',
                        dateOffsetDays: 7,
                        passingCriteria: 'Show strong technical knowledge'
                    }
                ]
            };

            vi.mocked(groq.getGroqChatCompletion).mockResolvedValue(JSON.stringify(mockResponse));

            const result = await generatePipeline('Software Engineer', 'Senior', 'Engineering');

            expect(result.rounds).toHaveLength(2);
            expect(result.warning).toContain('fewer than 3 rounds');
        });

        it('should timeout after 10 seconds', async () => {
            vi.mocked(groq.getGroqChatCompletion).mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve('{}'), 15000))
            );

            await expect(
                generatePipeline('Software Engineer', 'Senior', 'Engineering')
            ).rejects.toThrow('timed out after 10 seconds');
        }, 12000);

        it('should validate round types and filter invalid ones', async () => {
            const mockResponse = {
                rounds: [
                    {
                        roundName: 'Valid Round',
                        roundType: 'aptitude test',
                        dateOffsetDays: 0,
                        passingCriteria: 'Pass criteria'
                    },
                    {
                        roundName: 'Invalid Round',
                        roundType: 'invalid type',
                        dateOffsetDays: 3,
                        passingCriteria: 'Pass criteria'
                    },
                    {
                        roundName: 'Another Valid Round',
                        roundType: 'HR interview',
                        dateOffsetDays: 7,
                        passingCriteria: 'Pass criteria'
                    }
                ]
            };

            vi.mocked(groq.getGroqChatCompletion).mockResolvedValue(JSON.stringify(mockResponse));

            const result = await generatePipeline('Software Engineer', 'Senior', 'Engineering');

            // Should only include valid rounds
            expect(result.rounds).toHaveLength(2);
            expect(result.rounds.every(r => VALID_ROUND_TYPES.includes(r.roundType))).toBe(true);
        });

        it('should throw error for missing required parameters', async () => {
            await expect(generatePipeline('', 'Senior', 'Engineering')).rejects.toThrow(
                'Role title, seniority level, and department are required'
            );

            await expect(generatePipeline('Software Engineer', '', 'Engineering')).rejects.toThrow(
                'Role title, seniority level, and department are required'
            );

            await expect(generatePipeline('Software Engineer', 'Senior', '')).rejects.toThrow(
                'Role title, seniority level, and department are required'
            );
        });

        it('should throw error for invalid JSON response', async () => {
            vi.mocked(groq.getGroqChatCompletion).mockResolvedValue('invalid json');

            await expect(
                generatePipeline('Software Engineer', 'Senior', 'Engineering')
            ).rejects.toThrow('Failed to parse AI response as JSON');
        });

        it('should throw error when no valid rounds are generated', async () => {
            const mockResponse = {
                rounds: [
                    {
                        roundName: 'Invalid Round',
                        roundType: 'invalid type',
                        dateOffsetDays: 0,
                        passingCriteria: 'Pass criteria'
                    }
                ]
            };

            vi.mocked(groq.getGroqChatCompletion).mockResolvedValue(JSON.stringify(mockResponse));

            await expect(
                generatePipeline('Software Engineer', 'Senior', 'Engineering')
            ).rejects.toThrow('No valid rounds generated by AI');
        });

        it('should handle all valid round types', async () => {
            const mockResponse = {
                rounds: VALID_ROUND_TYPES.map((type, i) => ({
                    roundName: `${type} round`,
                    roundType: type,
                    dateOffsetDays: i * 3,
                    passingCriteria: 'Pass criteria'
                }))
            };

            vi.mocked(groq.getGroqChatCompletion).mockResolvedValue(JSON.stringify(mockResponse));

            const result = await generatePipeline('Software Engineer', 'Senior', 'Engineering');

            expect(result.rounds).toHaveLength(VALID_ROUND_TYPES.length);
            VALID_ROUND_TYPES.forEach(type => {
                expect(result.rounds.some(r => r.roundType === type)).toBe(true);
            });
        });

        it('should trim whitespace from round names and passing criteria', async () => {
            const mockResponse = {
                rounds: [
                    {
                        roundName: '  Aptitude Test  ',
                        roundType: 'aptitude test',
                        dateOffsetDays: 0,
                        passingCriteria: '  Score 70% or higher  '
                    }
                ]
            };

            vi.mocked(groq.getGroqChatCompletion).mockResolvedValue(JSON.stringify(mockResponse));

            const result = await generatePipeline('Software Engineer', 'Senior', 'Engineering');

            expect(result.rounds[0].roundName).toBe('Aptitude Test');
            expect(result.rounds[0].passingCriteria).toBe('Score 70% or higher');
        });

        it('should reject rounds with negative date offsets', async () => {
            const mockResponse = {
                rounds: [
                    {
                        roundName: 'Valid Round',
                        roundType: 'aptitude test',
                        dateOffsetDays: 0,
                        passingCriteria: 'Pass criteria'
                    },
                    {
                        roundName: 'Invalid Round',
                        roundType: 'HR interview',
                        dateOffsetDays: -5,
                        passingCriteria: 'Pass criteria'
                    }
                ]
            };

            vi.mocked(groq.getGroqChatCompletion).mockResolvedValue(JSON.stringify(mockResponse));

            const result = await generatePipeline('Software Engineer', 'Senior', 'Engineering');

            // Should only include the valid round
            expect(result.rounds).toHaveLength(1);
            expect(result.rounds[0].dateOffsetDays).toBe(0);
        });
    });
});
