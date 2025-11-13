const Template = require('./schemas/templateSchema');

/**
 * Template model for event templates
 */
module.exports = {
    /**
     * Get all templates
     * @returns {Promise<Array>} - Promise resolving to array of templates
     */
    getAllTemplates: async function() {
        try {
            return await Template.find().sort({ name: 1 }).exec();
        } catch (err) {
            console.error('Error getting all templates:', err);
            throw err;
        }
    },
    
    /**
     * Get templates by sport
     * @param {string} sport - Sport type
     * @returns {Promise<Array>} - Promise resolving to array of templates
     */
    getTemplatesBySport: async function(sport) {
        try {
            return await Template.find({ sport }).sort({ name: 1 }).exec();
        } catch (err) {
            console.error(`Error getting templates for sport ${sport}:`, err);
            throw err;
        }
    },
    
    /**
     * Get template by ID
     * @param {string} id - Template ID
     * @returns {Promise<Object>} - Promise resolving to template object
     */
    getTemplateById: async function(id) {
        try {
            return await Template.findById(id).exec();
        } catch (err) {
            console.error(`Error getting template ${id}:`, err);
            throw err;
        }
    },
    
    /**
     * Create a new template
     * @param {Object} templateData - Template data
     * @returns {Promise<Object>} - Promise resolving to created template
     */
    createTemplate: async function(templateData) {
        try {
            const template = new Template(templateData);
            return await template.save();
        } catch (err) {
            console.error('Error creating template:', err);
            throw err;
        }
    },
    
    /**
     * Update a template
     * @param {string} id - Template ID
     * @param {Object} templateData - Template data
     * @returns {Promise<Object>} - Promise resolving to updated template
     */
    updateTemplate: async function(id, templateData) {
        try {
            return await Template.findByIdAndUpdate(id, templateData, { new: true }).exec();
        } catch (err) {
            console.error(`Error updating template ${id}:`, err);
            throw err;
        }
    },
    
    /**
     * Delete a template
     * @param {string} id - Template ID
     * @returns {Promise<boolean>} - Promise resolving to deletion success
     */
    deleteTemplate: async function(id) {
        try {
            const result = await Template.findByIdAndDelete(id).exec();
            return !!result;
        } catch (err) {
            console.error(`Error deleting template ${id}:`, err);
            throw err;
        }
    },
    
    /**
     * Update last used date
     * @param {string} id - Template ID
     * @returns {Promise<Object>} - Promise resolving to updated template
     */
    updateLastUsed: async function(id) {
        try {
            return await Template.findByIdAndUpdate(id, 
                { last_used: new Date() }, 
                { new: true }
            ).exec();
        } catch (err) {
            console.error(`Error updating last used date for template ${id}:`, err);
            throw err;
        }
    }
}; 