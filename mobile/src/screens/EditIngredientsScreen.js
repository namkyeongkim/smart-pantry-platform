import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet
} from 'react-native';

const EditIngredientsScreen = ({ route, navigation }) => {

  const { ingredients, onSave } = route.params;

  const [text, setText] = useState(
    ingredients.map(i => i.original || i.name || i).join('\n')
  );

  const saveIngredients = () => {

    const updated = text.split('\n');

    if (onSave) {
      onSave(updated);
    }

    navigation.goBack();

  };

  return (

    <View style={styles.container}>

      <Text style={styles.title}>Edit Ingredients</Text>

      <TextInput
        style={styles.input}
        multiline
        value={text}
        onChangeText={setText}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={saveIngredients}
      >
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>

    </View>

  );

};

const styles = StyleSheet.create({

  container: {
    flex:1,
    padding:20,
    backgroundColor:'white'
  },

  title: {
    fontSize:20,
    fontWeight:'bold',
    marginBottom:15
  },

  input: {
    borderWidth:1,
    borderColor:'#ccc',
    borderRadius:8,
    padding:15,
    height:200,
    textAlignVertical:'top'
  },

  button: {
    marginTop:20,
    backgroundColor:'#27ae60',
    padding:15,
    borderRadius:8,
    alignItems:'center'
  },

  buttonText: {
    color:'white',
    fontWeight:'bold',
    fontSize:16
  }

});

export default EditIngredientsScreen;