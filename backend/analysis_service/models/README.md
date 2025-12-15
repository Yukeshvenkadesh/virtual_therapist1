# Model Directory

This directory contains your trained mental health analysis model.

## Model File Formats Supported

The system supports the following model formats:

1. **PyTorch Model (.pth)**: 
   - Complete model: `torch.save(model, 'mental_health_model_final.pth')`
   - State dict: `torch.save(model.state_dict(), 'mental_health_model_final.pth')`

2. **Hugging Face Model Directory**:
   - Place your model files in a subdirectory (e.g., `custom_model/`)
   - Include: `config.json`, `pytorch_model.bin`, `tokenizer.json`, etc.

## How to Add Your Model

### Option 1: PyTorch Model File
1. Save your trained model as `mental_health_model_final.pth`
2. Place it in this directory
3. Update the MODEL_PATH in your `.env` file if needed

### Option 2: Hugging Face Model Directory
1. Create a subdirectory (e.g., `custom_model/`)
2. Place all your model files in that directory
3. Update the MODEL_PATH in your `.env` file to point to the directory

## Model Requirements

Your model should:
- Accept text input and return classification scores
- Output 4 classes: ["Anxiety", "Depression", "Stress", "Neutral"]
- Be compatible with DistilBERT tokenizer (or provide your own tokenizer)

## Example Model Saving Code

```python
# Save complete model
torch.save(model, 'mental_health_model_final.pth')

# Or save state dict
torch.save({
    'state_dict': model.state_dict(),
    'labels': ['Anxiety', 'Depression', 'Stress', 'Neutral']
}, 'mental_health_model_final.pth')
```



























