import { searchWords } from './search-words';

describe('searchWords', () => {
  it('tira acentos e maiúsculas e separa as palavras', () => {
    expect(searchWords('  Ração   GATO! ')).toEqual(['racao', 'gato']);
    expect(searchWords('Pão-de-Queijo')).toEqual(['pao', 'de', 'queijo']);
    expect(searchWords('Água 500 ml')).toEqual(['agua', '500', 'ml']);
  });

  it('ignora repetidas, sinais e o que passa de 5 palavras', () => {
    expect(searchWords('bolo bolo %_\\')).toEqual(['bolo']);
    expect(searchWords('a b c d e f g')).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(searchWords('   ')).toEqual([]);
  });
});
