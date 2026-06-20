using TbhTracker.Core.Logic;

namespace TbhTracker.Tests;

public class BoxesTests
{
    [Fact]
    public void NormalizeThresholds_DefaultsWhenMissing()
    {
        var t = Boxes.NormalizeThresholds(null, null);
        Assert.Equal(25, t.Warn);
        Assert.Equal(75, t.High);
    }

    [Fact]
    public void NormalizeThresholds_EnsuresHighGreaterEqualWarn()
    {
        var t = Boxes.NormalizeThresholds(5, 3);
        Assert.Equal(5, t.Warn);
        Assert.Equal(5, t.High);
    }

    [Fact]
    public void NormalizeThresholds_EnsuresWarnAtLeastOne()
    {
        var t = Boxes.NormalizeThresholds(0, 10);
        Assert.Equal(1, t.Warn);
        Assert.Equal(10, t.High);
    }

    [Fact]
    public void ClassifyBacklog_NullIsOk() => Assert.Equal("ok", Boxes.ClassifyBacklog(null));

    [Theory]
    [InlineData(10, "ok")]
    [InlineData(30, "warn")]
    [InlineData(80, "high")]
    public void ClassifyBacklog_DefaultThresholds(int total, string expected) =>
        Assert.Equal(expected, Boxes.ClassifyBacklog(total));

    [Fact]
    public void ClassifyBacklog_CustomThresholds() =>
        Assert.Equal("warn", Boxes.ClassifyBacklog(6, new() { Warn = 5, High = 10 }));

    [Fact]
    public void BoxDrainSeconds_MultipliesCooldownByQuantity() =>
        Assert.Equal(600, Boxes.BoxDrainSeconds("common", 2));

    [Fact]
    public void BoxDrainSeconds_NullForActBoss() =>
        Assert.Null(Boxes.BoxDrainSeconds("actBoss", 5));

    [Fact]
    public void BoxDrainSeconds_NullWhenEmpty() =>
        Assert.Null(Boxes.BoxDrainSeconds("common", 0));

    [Theory]
    [InlineData(0, "common")]
    [InlineData(1, "stageBoss")]
    [InlineData(2, "actBoss")]
    public void KindFromTypeValue_MapsKnown(int value, string expected) =>
        Assert.Equal(expected, Boxes.KindFromTypeValue(value));

    [Fact]
    public void KindFromTypeValue_NullForUnknown() =>
        Assert.Null(Boxes.KindFromTypeValue(9));
}
