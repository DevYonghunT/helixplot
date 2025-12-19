using System;

namespace Helixplot.Core
{
    public struct Complex
    {
        public double Real;
        public double Imag;

        public Complex(double real, double imag)
        {
            Real = real;
            Imag = imag;
        }

        public double Magnitude => Math.Sqrt(Real * Real + Imag * Imag);
        public double Phase => Math.Atan2(Imag, Real);

        public static Complex FromPolar(double r, double theta) => new Complex(r * Math.Cos(theta), r * Math.Sin(theta));

        public static Complex operator +(Complex a, Complex b) => new Complex(a.Real + b.Real, a.Imag + b.Imag);
        public static Complex operator -(Complex a, Complex b) => new Complex(a.Real - b.Real, a.Imag - b.Imag);
        public static Complex operator *(Complex a, Complex b) => new Complex(a.Real * b.Real - a.Imag * b.Imag, a.Real * b.Imag + a.Imag * b.Real);
        // a / b = (a * conj(b)) / |b|^2
        public static Complex operator /(Complex a, Complex b)
        {
            double den = b.Real * b.Real + b.Imag * b.Imag;
            return new Complex((a.Real * b.Real + a.Imag * b.Imag) / den, (a.Imag * b.Real - a.Real * b.Imag) / den);
        }

        public static Complex operator -(Complex a) => new Complex(-a.Real, -a.Imag);
    }

    public enum ValueType { Double, Complex }

    public struct Value
    {
        public ValueType Type;
        public double Real; // Also used for Double type value
        public double Imag;

        public Value(double val)
        {
            Type = ValueType.Double;
            Real = val;
            Imag = 0;
        }

        public Value(Complex val)
        {
            Type = ValueType.Complex;
            Real = val.Real;
            Imag = val.Imag;
        }

        public bool IsComplex => Type == ValueType.Complex;
        
        public Complex ToComplex() => new Complex(Real, Imag);

        public static Value FromDouble(double d) => new Value(d);
        public static Value FromComplex(Complex c) => new Value(c);
    }
}
