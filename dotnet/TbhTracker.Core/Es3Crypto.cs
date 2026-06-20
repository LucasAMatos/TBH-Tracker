using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace TbhTracker.Core;

public sealed class Es3DecryptException : Exception
{
    public Es3DecryptException(string message, Exception? inner = null) : base(message, inner) { }
}

/// <summary>Port de src/main/es3.ts. Easy Save 3: AES-128-CBC + PBKDF2-SHA1 (100 it).
/// O IV (16 bytes) fica no inicio do arquivo e serve tambem de salt do PBKDF2.</summary>
public static class Es3Crypto
{
    private const int IvSize = 16;
    private const int KeySize = 16; // AES-128
    private const int Pbkdf2Iterations = 100;

    private static byte[] DeriveKey(string password, byte[] iv)
    {
        using var kdf = new Rfc2898DeriveBytes(
            Encoding.UTF8.GetBytes(password), iv, Pbkdf2Iterations, HashAlgorithmName.SHA1);
        return kdf.GetBytes(KeySize);
    }

    /// <summary>Descriptografa um buffer ES3 e retorna o JSON em texto (UTF-8).</summary>
    public static string Decrypt(byte[] buffer, string password)
    {
        if (buffer.Length <= IvSize)
            throw new Es3DecryptException("Arquivo de save muito pequeno ou vazio.");

        var iv = buffer[..IvSize];
        var cipher = buffer[IvSize..];
        var key = DeriveKey(password, iv);

        try
        {
            using var aes = Aes.Create();
            aes.Key = key;
            aes.IV = iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;
            using var dec = aes.CreateDecryptor();
            var plain = dec.TransformFinalBlock(cipher, 0, cipher.Length);
            return Encoding.UTF8.GetString(plain);
        }
        catch (CryptographicException err)
        {
            throw new Es3DecryptException(
                "Falha ao descriptografar o save. A chave ES3 provavelmente esta incorreta.", err);
        }
    }

    /// <summary>Descriptografa e faz parse para JsonElement, com erro amigavel.</summary>
    public static JsonElement DecryptAndParse(byte[] buffer, string password)
    {
        var text = Decrypt(buffer, password);
        try
        {
            using var doc = JsonDocument.Parse(text);
            return doc.RootElement.Clone();
        }
        catch (JsonException err)
        {
            throw new Es3DecryptException(
                "Save descriptografado, mas o JSON e invalido (formato inesperado ou chave incorreta).", err);
        }
    }

    /// <summary>Filtro rapido para o keyFinder: decifra so o 1o bloco (sem padding) e exige
    /// que o primeiro byte seja '{' (0x7b). Evita o custo do parse completo nos candidatos.</summary>
    public static bool QuickFirstBlockIsBrace(byte[] buffer, string password)
    {
        if (buffer.Length <= IvSize + 16) return false;
        var iv = buffer[..IvSize];
        try
        {
            var key = DeriveKey(password, iv);
            using var aes = Aes.Create();
            aes.Key = key;
            aes.IV = iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.None;
            using var dec = aes.CreateDecryptor();
            var firstBlock = dec.TransformFinalBlock(buffer, IvSize, 16);
            return firstBlock.Length > 0 && firstBlock[0] == 0x7b;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>True se a senha descriptografa o save para JSON valido (confirmacao completa).</summary>
    public static bool Validate(byte[] buffer, string password)
    {
        try
        {
            DecryptAndParse(buffer, password);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
