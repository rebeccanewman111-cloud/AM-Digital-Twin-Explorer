export const digitalTwinStore = {
  dataset: null,
  currentIndex: 0,

  setDataset(dataset) {
    this.dataset = dataset;
    this.currentIndex = 0;
  },

  setCurrentIndex(index) {
    this.currentIndex = index;
  },

  getRows() {
    return this.dataset?.rows || [];
  },

  getMetadata() {
    return this.dataset?.metadata || {};
  },

  getColumns() {
    return this.dataset?.columns || [];
  },

  getSourceName() {
    return this.dataset?.sourceName || "uploaded data";
  },

  getCurrentRow() {
    const rows = this.getRows();
    return rows[this.currentIndex] || null;
  }
};